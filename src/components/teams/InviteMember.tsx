import { useState, useEffect, Fragment, useCallback } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/router';
import Link from 'next/link';

import arrowLeft from 'public/assets/svg/arrow-left-black.svg';

import InviteTeamMembersForm from './InviteTeamMembersForm';
import LoadingMembersSpinner from '../organizations/LoadingMembersSpinner';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { Teams } from '~/lib/teams/types/teams';
import useFetchTeamsById from '~/lib/server/teams/get-teams-id';
import { useInviteTeamMembers } from '~/lib/teams/hooks/use-invite-team-members';

import { useAuth } from 'reactfire';
import AnonymousWarning from '../shared/anonymousWarning';
import { useFetchAcceptedInvitedMembers } from '~/lib/organizations/hooks/use-fetch-accepted-invites';
import { useGetOrganizationById } from '~/lib/organizations/hooks/use-get-organization-by-id';

export default function InviteMemberScreen() {
  const router = useRouter();
  const { id } = router.query;

  const auth = useAuth();
  const user = auth.currentUser;

  const organizationData = useCurrentOrganization();

  const organizationId = organizationData?.id as string;
  const { organization } = useGetOrganizationById(organizationId);
  const teamId = id as string;

  const { data, loading } = useFetchTeamsById(organizationId, teamId, 1, '');

  const [team, setTeams] = useState<Teams>();

  const { trigger, isMutating } = useInviteTeamMembers(organizationId, teamId);

  const { totalInvitations } = useFetchAcceptedInvitedMembers(
    organization?.id as string,
  );

  const [organizationInvites, setOrganizationInvites] = useState(0);

  useEffect(() => {
    if (totalInvitations) setOrganizationInvites(totalInvitations);
  }, [totalInvitations]);

  const navigateToMembersPage = useCallback(() => {
    void router.push(`/settings/teams/${teamId}`);
  }, [router, teamId]);

  useEffect(() => {
    setTeams(data);
  }, [data]);

  if (loading) return <LoadingMembersSpinner />;

  if (user?.isAnonymous) return <AnonymousWarning />;

  return (
    <Fragment>
      {team && (
        <div>
          <p className="text-center text-xl font-medium">{team.name}</p>
          <div className="md:flex justify-between">
            <p className="text-xl font-medium mt-6 md:mt-0">Invite Members</p>
            <div className="flex space-x-2 mt-2 md:mt-0">
              <Link
                href={`/settings/teams/${id}`}
                className="flex bg-[#F4F4F5] px-4 py-2 space-x-2 rounded-md hover:bg-gray-50"
              >
                <Image
                  className="my-auto"
                  src={arrowLeft}
                  alt="arrowLeft"
                ></Image>
                <p className="text-sm">Back to members</p>
              </Link>
            </div>
          </div>
          <div className="mt-7">
            <InviteTeamMembersForm
              type={'admin-member'}
              trigger={trigger}
              isMutating={isMutating}
              submitAction={navigateToMembersPage}
              organizationInvites={
                (Object.keys(organization?.members ?? {}).length as number) - 1
              }
            />
          </div>
        </div>
      )}
    </Fragment>
  );
}
