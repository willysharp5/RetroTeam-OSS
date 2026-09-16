import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { withAdminProps } from '~/lib/admin/props/with-admin-props';
import { getOrganizationMembersByOrganizationId } from '~/lib/admin/queries';

import AdminHeader from '~/components/admin/AdminHeader';
import AdminRouteShell from '~/components/admin/AdminRouteShell';

import configuration from '~/configuration';

import TextField from '~/core/ui/TextField';
import Heading from '~/core/ui/Heading';
import { useApiRequest } from '~/core/hooks/use-api';

import useSWRMutation from 'swr/mutation';

import ErrorMessage from '~/components/shared/errorMessage';

type Props = React.PropsWithChildren<{
  members: Awaited<ReturnType<typeof getOrganizationMembersByOrganizationId>>;
  organizationId: string;
}>;

function AdminOrganizationMembersPage({ members }: Props) {
  return (
    <AdminRouteShell>
      <Head>
        <title>{`Manage Members | ${configuration.site.siteName}`}</title>

        <link rel="shortcut icon" href="/assets/images/favicon/favicon.ico" />
        <link rel="canonical" href={configuration.site.siteUrl} />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href="/assets/images/favicon/apple-touch-icon.png"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/assets/images/favicon/favicon-16x16.png"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/assets/images/favicon/favicon-32x32.png"
        />

        <link rel="manifest" href="/assets/images/favicon/site.webmanifest" />

        <link
          rel="mask-icon"
          href="/assets/images/favicon/safari-pinned-tab.svg"
          color="#000000"
        />

        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />

        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta
          name="msapplication-config"
          content="/favicon/browserconfig.xml"
        />
        <meta name="robots" content="noindex"></meta>
      </Head>

      <AdminHeader>Create Organization</AdminHeader>

      <div className={'p-3 flex flex-col flex-1 space-y-4'}>
        <div className="mx-6 space-y-6">
          <Heading type={4}>Organization Details</Heading>
          <div className={'flex space-x-2 space-y-2 items-center'}>
            <div className={'inline-flex'}></div>
          </div>
          <Content />
        </div>
      </div>
    </AdminRouteShell>
  );
}

interface CompleteOnboardingStepData {
  organization: string;
  teamName: string;
  name: string;
  lastName: string;
  email: string;
}

function Content() {
  const router = useRouter();

  const { trigger } = useCreateOrganizationRequest();

  function useCreateOrganizationRequest() {
    const fetcher = useApiRequest<void, CompleteOnboardingStepData>();

    return useSWRMutation(
      '/api/admin/organization/create',
      (path, { arg: body }: { arg: CompleteOnboardingStepData }) => {
        return fetcher({
          path,
          body,
        });
      },
    );
  }

  // Organization fields
  const [organizationName, setOrganizationName] = useState('');

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');

  const [teamName, setTeamName] = useState('');

  const [error, setError] = useState<any>(null);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Required fields
      if (
        !organizationName.trim() ||
        !teamName.trim() ||
        !adminName.trim() ||
        !adminLastName.trim() ||
        !adminEmail.trim()
      ) {
        toast.error('Please fill all the data.');
        return;
      }

      if (!adminPassword.trim()) {
        toast.error('Please add a password for the admin');
        return;
      }

      try {
      const data = {
        organization: organizationName,
        teamName,
        name: adminName,
        lastName: adminLastName,
        email: adminEmail,
        password: adminPassword,
      };

      const promise = trigger(data) as Promise<any>;

      await toast.promise(promise, {
        loading: 'Creating organization...',
        success: 'Organization created successfully!',
        error: 'Failed to create organization.',
      });

      const res = await promise;
      if (res.success) {
        setError(null)
        setTimeout(() => {
          router.push('/admin/organizations');
        }, 1500);
      } else {
        setError(res.error);
      }
      }
      catch(e: any){
         setError(e.error);
      }
 
    },
    [
      organizationName,
      teamName,
      adminName,
      adminLastName,
      adminEmail,
      adminPassword,
      router,
      trigger,
    ],
  );

  return (
    <form onSubmit={onSubmit}>
      <ErrorMessage
        title="Error on creating organization"
        error={error as string}
      />
      <div className="md:flex w-full space-between">
        <div className="w-full">
          <div className="mt-2">
            <TextField.Label>
              Organization Name
              <TextField.Input
                className="max-w-sm"
                value={organizationName}
                onChange={(e: any) => setOrganizationName(e.target.value)}
              />
            </TextField.Label>
          </div>
        </div>
      </div>

      <div className="space-y-6 mt-6">
        <Heading type={4}>Admin</Heading>
        <div className="md:flex space-y-6 md:space-y-0 md:space-x-6">
          <input
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm"
            placeholder="Email"
          />
          <input
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm"
            placeholder="Password"
            type="text"
          />
          <input
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm"
            placeholder="Name"
          />
          <input
            value={adminLastName}
            onChange={(e) => setAdminLastName(e.target.value)}
            className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm"
            placeholder="Last name"
          />
        </div>

        <div className="mt-6" />
        <Heading type={4}>Team</Heading>
        <input
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm"
          placeholder="Team name"
        />

        <div className="mt-6">
          <button
            type="submit"
            className="px-6 py-3 rounded-md bg-black  hover:bg-gray-500 text-white font-medium"
          >
            Submit
          </button>
        </div>
      </div>
    </form>
  );
}

export default AdminOrganizationMembersPage;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const adminProps = await withAdminProps(ctx);

  if ('redirect' in adminProps) {
    return adminProps;
  }

  return {
    props: {
      ...adminProps.props,
    },
  };
}
