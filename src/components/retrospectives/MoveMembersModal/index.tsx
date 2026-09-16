import { useState, useEffect, useCallback } from 'react';
import toaster from 'react-hot-toast';

import Image from 'next/image';

import { InfoContainer, Participant } from '../Results';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { TeamMembers } from '~/lib/teams/types/teams';
import { useFetchTeams } from '~/lib/server/teams/get-teams';
import { useMoveRetrospectiveTeam } from '~/lib/retrospectives/hooks/use-move-retrospective-team';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import useMoveRetrospectiveMembers from '~/lib/retrospectives/hooks/use-move-retrospectives-members';

import close from 'public/assets/svg/close.svg';

import SearchableDropdown from '~/components/shared/searchableDropdown/searchableDropdown';
import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';
import { useGetBoardByRetrospectiveId } from '~/lib/board/hooks/use-get-board-by-retrospective';
import { useUserSession } from '~/core/hooks/use-user-session';

interface MoveMembersModalProps {
  retrospectiveId: string;
  closeModal: () => void;
  userId: string;
  retrospectiveTeam: string;
  retrospective: Retrospectives;
  submit?: () => void;
}

const MoveMembersModal = ({
  retrospectiveId,
  closeModal,
  userId,
  retrospectiveTeam,
  retrospective,
  submit,
}: MoveMembersModalProps) => {
  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  const currentUser = useUserSession();

  const {
    data: teamsData,
    dropdownSearch,
    loadingSearch,
    loading,
  } = useFetchTeams(
    organizationId,
    userId,
    10,
    '',
    '',
    retrospective.teamData.id,
  );
  const [data, setData] = useState<any>([]);

  useEffect(() => {
    if (teamsData && teamsData?.length > 0) {
      setData(teamsData);
    }
  }, [teamsData]);

  const { members: _members } = useGetBoardByRetrospectiveId(
    organizationId,
    retrospectiveId,
  );

  const moveRetrospectiveTeam = useMoveRetrospectiveTeam();
  const { trigger: moveRetrospectiveMembers } =
    useMoveRetrospectiveMembers(retrospectiveId);

  const [selectedTeam, setSelectedTeam] = useState<any>();

  const [missinMembers, setMissingMembers] = useState<
    TeamMembers[] | undefined
  >([]);
  const [activeMembers, setActiveMembers] = useState<TeamMembers[] | undefined>(
    _members,
  );
  const [deActivateMembers, setDeactivateMembers] = useState<
    TeamMembers[] | undefined
  >(_members);

  const [step, setStep] = useState(1);

  useEffect(() => {
    const active = _members.filter(
      (member: TeamMembers) => member.active === true,
    );
    setActiveMembers(active);
    const deactivated = _members.filter(
      (member: TeamMembers) => member.active === false,
    );
    setDeactivateMembers(deactivated);
  }, [_members]);

  function findMissingMembers(array1: any, array2: any) {
    const userIdsArray2 = array2.map((item: any) => item.userId);

    const missingMembers = array1.filter(
      (member: any) => !userIdsArray2.includes(member.userId),
    );

    return missingMembers;
  }

  const onUpdateRetrospectiveTeam = useCallback(() => {
    void (async () => {
      try {
        const teamId = selectedTeam?.id as string;
        const promise = moveRetrospectiveTeam(
          organizationId,
          teamId,
          retrospectiveId,
        ).then(() => {
          if (!submit) window.location.reload();
        });

        await toaster.promise(promise, {
          loading: 'Moving retrospective team',
          success: 'Retrospective team updated',
          error: 'Error updating retrospective team',
        });

        if (submit) {
          setTimeout(() => {
            submit();
          }, 2000);
        }
      } catch (e) {
        console.log(e);
      }
    })();
  }, [
    moveRetrospectiveTeam,
    organizationId,
    retrospectiveId,
    selectedTeam,
    submit,
  ]);

  const onUpdateRetrospectiveMembers = useCallback(() => {
    void (async () => {
      try {
        const teamId = selectedTeam?.id as string;
        const body = {
          organizationId,
          teamId,
          members: deActivateMembers,
          activeMembers: missinMembers,
          boardName: retrospective.name,
          facilitator: currentUser?.data?.fullName,
          teamName: selectedTeam.name as string,
        };
        const promise = moveRetrospectiveMembers(body).then((res: any) => {
          if (res.success) {
            window.location.reload();
          }
        });

        await toaster.promise(promise, {
          loading: 'Moving retrospective team',
          success: 'Retrospective team updated',
          error: 'Error updating retrospective team',
        });
      } catch (e) {
        console.log(e);
      }
    })();
  }, [
    moveRetrospectiveMembers,
    organizationId,
    selectedTeam,
    deActivateMembers,
    missinMembers,
    currentUser,
    retrospective,
  ]);

  const moveRetrospectiveTeamHandler = useCallback(() => {
    void (async () => {
      if (selectedTeam) {
        if (retrospective.access.type === 'team') {
          const selectedTeamArrary = Object.keys(selectedTeam.membersArray).map(
            (key) => ({
              userId: selectedTeam.membersArray[key].userId,
              user: selectedTeam.membersArray[key].user,
              active: selectedTeam.membersArray[key].active,
            }),
          );

          const newMembers = findMissingMembers(
            activeMembers,
            selectedTeamArrary,
          );

          setMissingMembers(newMembers);
          if (newMembers.length > 0) {
            setStep(2);
          } else {
            onUpdateRetrospectiveMembers();
          }
        } else {
          onUpdateRetrospectiveTeam();
        }
      } else {
        toaster.error('Please select a team');
      }
    })();
  }, [
    selectedTeam,
    retrospective,
    activeMembers,
    onUpdateRetrospectiveMembers,
    onUpdateRetrospectiveTeam,
  ]);

  return (
    <InfoContainer hasHeader={true}>
      <Image
        className="absolute top-2 md:top-5 right-5 cursor-pointer"
        src={close}
        alt="close"
        onClick={closeModal}
      />
      {step === 1 ? (
        <>
          <div className="mb-6 flex justify-center">
            <span className=" text-center text-zinc-500 text-md">
              Change retrospective team <b>from</b>{' '}
              {retrospective.teamData.name} <b>to</b>
            </span>
          </div>
          {!loading ? (
            <div className="md:w-1/2 m-auto">
              <SearchableDropdown
                refetch={dropdownSearch}
                label="name"
                placeholder={'Type Team Name'}
                options={data}
                handleChange={setSelectedTeam}
                selectedVal={selectedTeam}
                loading={loadingSearch}
              />
            </div>
          ) : (
            <LoadingMembersSpinner />
          )}

          <div className="flex w-full mt-6">
            <button
              disabled={data.length === 0}
              onClick={moveRetrospectiveTeamHandler}
              className="disabled:bg-orange-300 m-auto justify-center bg-orange-500 hover:bg-orange-400 px-4 py-2 rounded-md text-white"
            >
              Move Board to New Team
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6">
            <span className="text-zinc-500 text-sm">
              This team has members that are not part of the team. We will add
              there members to the team
            </span>
          </div>
          <div id="participants" className="max-h-[200px] overflow-y-auto">
            {missinMembers &&
              missinMembers.map((member, index) => (
                <Participant
                  organizationId={organizationId}
                  userId={member.userId}
                  key={`${index} ${member.userId}`}
                  name={member.fullName}
                  role={member.role > 0 ? 'Facilitator' : 'Member'}
                />
              ))}
          </div>
          <div className="flex w-full mt-6">
            <button
              onClick={onUpdateRetrospectiveMembers}
              className="m-auto justify-center bg-orange-500 hover:bg-orange-400 px-4 py-2 rounded-md text-white"
            >
              Change retrospective team
            </button>
          </div>
        </>
      )}
    </InfoContainer>
  );
};

export default MoveMembersModal;
