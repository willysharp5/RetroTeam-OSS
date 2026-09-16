import { useCallback, useEffect, useState } from 'react';

import { GetServerSidePropsContext } from 'next';
import { Trans } from 'next-i18next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Image from 'next/image';

import { useUserCanInviteUsers } from '~/lib/organizations/hooks/use-user-can-invite-users';
import { withAppProps } from '~/lib/props/with-app-props';

import OrganizationSettingsTabs from '~/components/organizations/OrganizationSettingsTabs';

import Button from '~/core/ui/Button';
import If from '~/core/ui/If';

import SettingsPageContainer from '~/components/settings/SettingsPageContainer';
import SettingsContentContainer from '~/components/settings/SettingsContentContainer';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';

import { useCurrentUserRole } from '~/lib/organizations/hooks/use-current-user-role';

import { useUserSession } from '~/core/hooks/use-user-session';

import { AnonymousModal } from '~/components/shared/anonymousModal';

import users from 'public/assets/svg/users.svg';
import add from 'public/assets/svg/user-plus-2.svg';
import AnonymousWarning from '~/components/shared/anonymousWarning';
import { useCurrentTeam } from '~/lib/organizations/hooks/use-current-team';

const OrganizationMembersList = dynamic(
  () => import('~/components/organizations/OrganizationMembersList'),
  {
    ssr: false,
  },
);

const OrganizationInvitedMembersList = dynamic(
  () => import('~/components/organizations/OrganizationInvitedMembersList'),
  {
    ssr: false,
  },
);

const OrganizationMembersPage: React.FCC = () => {
  const canInviteUsers = useUserCanInviteUsers();

  const organization = useCurrentOrganization();
  const id = organization?.id as string;

  const { team } = useCurrentTeam();
  const teamId = team?.id as string;

  const user = useUserSession();
  const facilitator = user?.data?.name + ' ' + user?.data?.lastName;
  const currentUserRole = useCurrentUserRole() as number;

  const [totalPendingInvites, setTotalPendingInvites] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);

  const [anonymousModal, setAnonymousModal] = useState(false);

  if (!id) {
    return null;
  }

  return (
    <SettingsPageContainer title={'Settings'}>
      {anonymousModal && (
        <AnonymousModal description="You are an anonymous user. Please sign up with an email to invite members"></AnonymousModal>
      )}
      <Head>
        <title key="title">Organization Members</title>
      </Head>

      <OrganizationSettingsTabs isAnonymous={user?.auth?.isAnonymous} />
      <SettingsContentContainer>
        {user?.auth?.isAnonymous ? (
          <AnonymousWarning />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between">
              <div className="md:flex space-x-0 space-y-2 md:space-x-10 md:space-y-0">
                <div>
                  <h1 className="font-medium text-xl">
                    <Trans i18nKey={'organization:membersTabLabel'} />
                  </h1>
                  <p className={'text-gray-500 dark:text-gray-400'}>
                    <Trans i18nKey={'organization:membersTabSubheading'} />
                  </p>
                </div>

                <If condition={canInviteUsers}>
                  <div className="h-auto">
                    <InviteMembersButton
                      isAnonymous={user?.auth?.isAnonymous}
                      setAnonymousModal={setAnonymousModal}
                    />
                  </div>
                </If>
              </div>
              <div className="flex space-x-2">
                <Image className="w-4" src={users} alt="teams"></Image>
                <p className="my-auto font-medium text-sm">
                  {totalMembers} Members
                </p>
              </div>
            </div>
            <div className="flex flex-1 flex-col space-y-6">
              <OrganizationMembersList
                organizationId={id}
                setTotalMembers={setTotalMembers}
              />
              <If condition={currentUserRole}>
                <div className="flex justify-between">
                  <div className="md:flex space-x-0 space-y-2 md:space-x-2 md:space-y-0">
                    <div>
                      <h1 className="font-medium text-xl">
                        <Trans i18nKey={'organization:pendingInvitesHeading'} />
                      </h1>
                      <p className={'text-gray-500 dark:text-gray-400'}>
                        <Trans
                          i18nKey={'organization:pendingInvitesSubheading'}
                        />
                      </p>
                    </div>

                    <If condition={canInviteUsers}>
                      <div className="h-auto">
                        <InviteMembersButton
                          isAnonymous={user?.auth?.isAnonymous}
                          setAnonymousModal={setAnonymousModal}
                        />
                      </div>
                    </If>
                  </div>
                  <div className="flex space-x-2">
                    <Image className="w-4" src={users} alt="teams"></Image>
                    <p className="my-auto font-medium text-sm">
                      {totalPendingInvites} Members
                    </p>
                  </div>
                </div>
                <OrganizationInvitedMembersList
                  setTotalPendingInvites={setTotalPendingInvites}
                  organizationId={id}
                  facilitator={facilitator}
                  teamId={teamId}
                />
              </If>
            </div>
          </div>
        )}{' '}
      </SettingsContentContainer>
    </SettingsPageContainer>
  );
};

export default OrganizationMembersPage;

export function getServerSideProps(ctx: GetServerSidePropsContext) {
  return withAppProps(ctx);
}

function InviteMembersButton({ isAnonymous, setAnonymousModal }: any) {
  const router = useRouter();

  const navigateToInviteMembersPage = useCallback(() => {
    if (!isAnonymous) {
      void router.push(`/settings/organization/members/invite`);
    } else {
      setAnonymousModal(true);
    }
  }, [router, isAnonymous, setAnonymousModal]);

  return (
    <Button
      onClick={navigateToInviteMembersPage}
      size={'small'}
      className={'w-full lg:w-auto'}
      data-cy={'invite-form-link'}
      type="button"
      color="gray"
    >
      <span className="flex items-center space-x-2">
        <Image className="my-auto" src={add} alt="plus"></Image>

        <p className="text-sm font-normal">
          <Trans i18nKey={'organization:inviteMembersButtonLabel'} />
        </p>
      </span>
    </Button>
  );
}
