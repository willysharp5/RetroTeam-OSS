import { Fragment, useEffect, useState } from 'react';
import toaster, { toast } from 'react-hot-toast';
import { useUser } from 'reactfire';

import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { withAppProps } from '~/lib/props/with-app-props';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { Organization } from '~/lib/organizations/types/organization';
import { useUpdateJiraOrganization } from '~/lib/organizations/hooks/use-update-jira-organization';
import { useGetOrganizationById } from '~/lib/organizations/hooks/use-get-organization-by-id';
import { useCurrentUserRole } from '~/lib/organizations/hooks/use-current-user-role';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

import SettingsPageContainer from '~/components/settings/SettingsPageContainer';
import AnonymousWarning from '~/components/shared/anonymousWarning';
import IntegrationSettingsTabs from '~/components/profile/IntegrationSettingsTabs';
import MembersWarning from '~/components/shared/MembersWarning';
import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';
import ErrorMessage from '~/components/shared/errorMessage';

import jiraLogo from '/public/assets/svg/jira.svg';
import questionIcon from 'public/assets/svg/question.svg';
import x from 'public/assets/svg/x.svg';
import jiraInstructions from 'public/assets/images/jiraInstructions.png';
import jiraInstructions2 from 'public/assets/images/jiraInstructions2.png';

import configuration from '~/configuration';

import If from '~/core/ui/If';
import BlurPortal from '~/components/shared/blurPortal';

const Integration = () => {
  const { data: user } = useUser();
  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  const role = useCurrentUserRole();

  const [helpModal, setHelpModal] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <SettingsPageContainer title={'Integration'}>
      <Head>
        <title key="title">Integration</title>
      </Head>
      {user ? (
        <Fragment>
          {user.isAnonymous || !user.email ? (
            <div className={'w-full px-8 py-6'}>
              <AnonymousWarning />
            </div>
          ) : role === MembershipRole.Member ? (
            <div className={'w-full px-8 py-6'}>
              <MembersWarning organizationId={organizationId} />
            </div>
          ) : (
            role === MembershipRole.Admin && (
              <Fragment>
                <IntegrationSettingsTabs />
                {helpModal && <HelpJiraModal setHelpModal={setHelpModal} />}
                <div className={'flex flex-col space-y-6 mx-6 md:w-full'}>
                  <div className={`rounded-lg p-2.5 lg:p-6`}>
                    <div className="space-y-8 max-h-[200px] tv:max-h-[400px]">
                      <div className="flex justify-between">
                        <div className="flex items-end gap-2">
                          <Image
                            src={jiraLogo}
                            className={'w-12 h-12'}
                            alt="jira"
                          />
                          <p className="font-bold text-3xl">Jira</p>
                        </div>
                        <button onClick={() => setHelpModal(true)}>
                          <Image
                            alt="questionIcon"
                            src={questionIcon}
                            width={30}
                            height={30}
                          />
                        </button>
                      </div>

                      <Content user={user} organizationId={organizationId} />
                    </div>
                  </div>
                </div>
              </Fragment>
            )
          )}
        </Fragment>
      ) : (
        <div className="m-auto h-32 flex justify-center w-full">
          <LoadingMembersSpinner />
        </div>
      )}
    </SettingsPageContainer>
  );
};

const Content = ({ organizationId }: any) => {
  const [connected, setConnected] = useState(false);

  const { organization } = useGetOrganizationById(organizationId);

  const router = useRouter();
  const { error } = router.query;

  useEffect(() => {
    if (organization && organization?.jiraIntegration) {
      setConnected(organization.jiraIntegration.connected);
    } else {
      setConnected(false);
    }
  }, [organization]);

  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const [updateOrganization, { loading }] = useUpdateJiraOrganization();

  const handleConnect = () => {
    if (clientId !== '' && clientSecret !== '' && apiKey !== '') {
      const organizationData: WithId<Partial<Organization>> = {
        id: organizationId,
        jiraIntegration: {
          clientId: btoa(clientId),
          clientSecret: btoa(clientSecret),
          apiKey: btoa(apiKey),
        },
      };

      updateOrganization(organizationData).then((res) => {
        const url = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${clientId}&scope=read:jira-user read:me&redirect_uri=${configuration.site.siteUrl}/api/jira/connect&response_type=code&prompt=consent`;
        window.location.href = url;
      });
    } else {
      toast.error('Please fill all inputs');
    }
  };

  const handleDisconnect = async () => {
    const organizationData: any = {
      id: organizationId,
      jiraIntegration: {
        connected: false,
        clientId: organization.jiraIntegration.clientId,
        clientSecret: organization.jiraIntegration.clientId,
        apiKey: organization.jiraIntegration.apiKey,
        accessToken: organization.jiraIntegration.accessToken,
        domain: organization.jiraIntegration.domain,
        email: organization.jiraIntegration.email,
      },
    };

    const promise = updateOrganization(organizationData);

    await toaster.promise(promise, {
      loading: 'Disconnecting JIRA integration',
      success: 'JIRA integration has been disconnected',
      error: 'Error disconnecting JIRA',
    });
  };

  return (
    <Fragment>
      {connected ? (
        <div className="space-y-4">
          <p className="break-words space-y-2">
            Your workspace is connected to Jira.
            <br />
          </p>

          <div className="bg-gray-100 justify-center w-full p-2 gap-2 space-y-2 md:space-y-6 space-between h-full md:flex items-center">
            <button
              onClick={handleDisconnect}
              className="h-[57px] md:w-[406px] py-2 px-3 rounded-md bg-orange-400 hover:bg-orange-300 text-white p-8"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          <If condition={error}>
            <ErrorMessage
              title="Error on connecting JIRA account"
              error={error as string}
            />
          </If>

          <p className="break-words space-y-2">
            Your workspace is not connected to Jira.
            <br />
            <p>Enter your Jira credentials to establish a connection.</p>
          </p>
          <p>Client Id</p>
          <input
            onChange={(e) => setClientId(e.target.value)}
            value={clientId}
            className="border h-[57px] py-2 px-3 w-full rounded-md"
            placeholder="client id"
          ></input>
          <p>Client Secret</p>
          <input
            onChange={(e) => setClientSecret(e.target.value)}
            value={clientSecret}
            type="password"
            className="border h-[57px] py-2 px-3 w-full rounded-md"
            placeholder="ATOA..."
          ></input>
          <p>Jira API token</p>
          <input
            onChange={(e) => setApiKey(e.target.value)}
            value={apiKey}
            type="password"
            className="border h-[57px] py-2 px-3 w-full rounded-md"
            placeholder="ATATT3..."
          ></input>
          <div className="bg-gray-100 w-full p-2 gap-2 md:space-y-0 space-y-2 space-between h-full md:flex items-center">
            <button
              onClick={handleConnect}
              className="h-[57px] md:w-[150px] py-2 px-3 rounded-md bg-orange-400 hover:bg-orange-300 text-white p-8"
            >
              Connect
            </button>
          </div>
        </div>
      )}
    </Fragment>
  );
};

function HelpJiraModal({ setHelpModal }: any) {
  return (
    <BlurPortal>
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          className="absolute inset-0 bg-black bg-opacity-30"
          onClick={() => setHelpModal(false)}
        />

        <div className="bg-white w-full max-w-[634px] max-h-[90vh] p-6 rounded-lg shadow-lg overflow-y-auto relative z-[60]">
          <div className="flex justify-between mb-4">
            <div>
              <p className="text-xl font-bold ">
                <b>Jira setup</b>
              </p>
              <a
                href="https://www.retroteam.ai/documentation/action-items-linked-to-jira"
                target="_blank"
                className="text-sm text-gray-500 underline"
              >
                Click here to see details on how to set up your API / Client /
                Secret and Token
              </a>
            </div>
            <button
              onClick={() => setHelpModal(false)}
              aria-label="Cerrar modal"
            >
              <Image src={x} alt="Cerrar" className="w-5 h-5" />
            </button>
          </div>
          <div>
            <p>
              Go to your{' '}
              <a
                className="text-blue-500 underline"
                href="https://developer.atlassian.com/console/myapps"
                target="_blank"
                rel="noopener noreferrer"
              >
                Jira Account &gt; Settings
              </a>
            </p>
            <div className="space-y-2">
              <p className="font-medium">Client ID and Secret</p>
              <Image
                src={jiraInstructions}
                alt="jiraInstructions"
                className="w-full max-w-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <a
              className="underline text-blue-500"
              href="https://id.atlassian.com/manage-profile/security/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
            >
              Jira API Token
            </a>
            <Image
              src={jiraInstructions2}
              alt="jiraInstructions2"
              className="w-full max-w-xl"
            />
          </div>
        </div>
      </div>
    </BlurPortal>
  );
}

export default Integration;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAppProps(ctx);
}
