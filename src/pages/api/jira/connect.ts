import type { NextApiRequest, NextApiResponse } from 'next';
import { parseCookies } from 'nookies';
import { connectJiraAccount } from '~/lib/server/jira/connect';
import { getOrganizationById } from '~/lib/server/queries';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            return res.redirect('/settings/integration?error=Invalid code');
        }

        const cookies = parseCookies({ req });

        const organizationId = cookies.organizationId;

        if (!organizationId) {
            return res.status(400).send('No userId found');
        }

        const organizationRef = await getOrganizationById(organizationId);
        const organizationData = organizationRef.data();

        if (!organizationData) {
            return res.status(400).send(`Organization ${organizationId} doesn't exist`);
        }

        if (!organizationData.jiraIntegration) {
            return res.redirect('/settings/integration?error=Missing Jira client ID or secret');
        }

        // Get auth token

        const body = {
            grant_type: 'authorization_code',
            client_id: atob(organizationData.jiraIntegration.clientId),
            client_secret: atob(organizationData.jiraIntegration.clientSecret),
            code: code,
            redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/jira/connect`,
        };

        const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!tokenResponse.ok) {
            console.error('Failed to get token', await tokenResponse.text());
            //  return res.redirect('/jira/error?message=token_failed');
        }

        // Get accesible resources
        const authTokenResponse = await tokenResponse.json();

        const response = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authTokenResponse.access_token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        // Get jira linked email

        const userResponse = await fetch('https://api.atlassian.com/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authTokenResponse.access_token}`,
                'Accept': 'application/json',
            },
        });

        const userInfo = await userResponse.json();

        const jiraAuth = await response.json();

        const data = {
            organizationId: organizationId,
            domain: jiraAuth[0].url,
            accessToken: authTokenResponse.access_token,
            email: userInfo.email
        }

        //Save results on database
        const result = await connectJiraAccount(data);
        if (result) {
            return res.redirect('/settings/integration');
        } else {
            res.send({ success: false });
        }
    } catch (error) {
        console.error('Jira callback error:', error);
        return res.redirect('/settings/integration?error=internal_error');
    }
}
