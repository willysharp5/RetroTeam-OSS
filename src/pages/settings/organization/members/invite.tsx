import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { Trans } from 'next-i18next';
import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon';

import { withAppProps } from '~/lib/props/with-app-props';

import OrganizationSettingsTabs from '~/components/organizations/OrganizationSettingsTabs';
import InviteMembersForm from '~/components/organizations/InviteMembersForm';
import SettingsPageContainer from '~/components/settings/SettingsPageContainer';
import SettingsContentContainer from '~/components/settings/SettingsContentContainer';

import Button from '~/core/ui/Button';
import SettingsTile from '~/components/settings/SettingsTile';
import { useAuth } from 'reactfire';
import AnonymousWarning from '~/components/shared/anonymousWarning';
import If from '~/core/ui/If';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';

// Members that can be added to a single invite batch. Not a plan limit — it
// only keeps the form from growing unmanageably long.
const MAX_INVITES_PER_BATCH = 10;

const OrganizationMembersInvitePage: React.FCC = () => {
  const auth = useAuth();
  const currentUser = auth.currentUser;
  const organization = useCurrentOrganization();
  return (
    <SettingsPageContainer title={'Settings'}>
      <Head>
        <title key="title">Invite Members</title>
      </Head>

      <OrganizationSettingsTabs
        isAnonymous={currentUser?.isAnonymous || !currentUser?.email}
      />

      <SettingsContentContainer>
        {currentUser?.isAnonymous || !currentUser?.email ? (
          <AnonymousWarning />
        ) : (
          <SettingsTile
            overflow={false}
            heading={
              <Trans i18nKey={'organization:inviteMembersPageHeading'} />
            }
            subHeading={
              <Trans i18nKey={'organization:inviteMembersPageSubheading'} />
            }
          >
            <Content />
          </SettingsTile>
        )}
        <If condition={!currentUser?.isAnonymous && currentUser?.email}>
          <div className={'mt-4'}>
            <GoBackToMembersButton />
          </div>
        </If>
      </SettingsContentContainer>
    </SettingsPageContainer>
  );
};

const Content = () => {
  return <InviteMembersForm limit={MAX_INVITES_PER_BATCH} />;
};

export default OrganizationMembersInvitePage;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAppProps(ctx);
}

function GoBackToMembersButton() {
  return (
    <Button
      size={'small'}
      color={'transparent'}
      href={'/settings/organization/members'}
    >
      <span className={'flex items-center space-x-1'}>
        <ArrowLeftIcon className={'h-3'} />

        <span>
          <Trans i18nKey={'organization:goBackToMembersPage'} />
        </span>
      </span>
    </Button>
  );
}
