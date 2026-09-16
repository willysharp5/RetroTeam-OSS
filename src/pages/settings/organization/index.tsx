import { GetServerSidePropsContext } from 'next';
import { Trans } from 'next-i18next';
import Head from 'next/head';

import { withAppProps } from '~/lib/props/with-app-props';

import FirebaseStorageProvider from '~/core/firebase/components/FirebaseStorageProvider';
import UpdateOrganizationForm from '~/components/organizations/UpdateOrganizationForm';
import OrganizationSettingsTabs from '~/components/organizations/OrganizationSettingsTabs';
import SettingsPageContainer from '~/components/settings/SettingsPageContainer';
import SettingsContentContainer from '~/components/settings/SettingsContentContainer';
import { useAuth } from 'reactfire';
import { useCurrentUserRole } from '~/lib/organizations/hooks/use-current-user-role';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import MembersWarning from '~/components/shared/MembersWarning';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import AnonymousWarning from '~/components/shared/anonymousWarning';
import { Fragment } from 'react';
import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';

const Organization = () => {
  const auth = useAuth();
  const currentUser = auth.currentUser;

  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  const role = useCurrentUserRole();

  return (
    <SettingsPageContainer title={'Settings'}>
      <Head>
        <title key="title">Organization Settings</title>
      </Head>

      <OrganizationSettingsTabs
        isAnonymous={currentUser?.isAnonymous || !currentUser?.email}
      />

      <SettingsContentContainer>
        <FirebaseStorageProvider>
          {currentUser ? (
            <Fragment>
              {currentUser?.isAnonymous || !currentUser?.email ? (
                <div className={'w-full'}>
                  <AnonymousWarning />
                </div>
              ) : role === MembershipRole.Member ? (
                <div className={'w-full'}>
                  <MembersWarning organizationId={organizationId} />
                </div>
              ) : (
                <UpdateOrganizationForm />
              )}
            </Fragment>
          ) : (
            <div className="m-auto h-32 flex justify-center w-full">
              <LoadingMembersSpinner />
            </div>
          )}
        </FirebaseStorageProvider>
      </SettingsContentContainer>
    </SettingsPageContainer>
  );
};

export default Organization;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAppProps(ctx);
}
