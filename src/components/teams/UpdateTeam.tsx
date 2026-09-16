import { useState, useCallback, useEffect } from 'react';
import toaster from 'react-hot-toast';

import Image from 'next/image';

import arrowLeft from 'public/assets/svg/arrow-left-black.svg';

import TeamMembersSelector from '../organizations/TeamMembersSelector';

import useUpdateTeams from '~/lib/teams/hooks/use-update-teams';
import { UpdateTeamScreenProps } from '~/lib/teams/types/teams';
import { useUserSession } from '~/core/hooks/use-user-session';

import trash from 'public/assets/svg/trash-white.svg';
import CancelContinueModal from '../shared/cancelContinueModal';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

import If from '~/core/ui/If';
import { useCurrentUserRole } from '~/lib/organizations/hooks/use-current-user-role';

export default function UpdateTeamScreen({
  setUpdateTeams,
  organizationId,
  organizationName,
  team,
  showModalHandler,
  totalTeams,
}: UpdateTeamScreenProps) {
  const user = useUserSession();
  const userData = user?.data;

  const currentUserRole = useCurrentUserRole();

  const { trigger: updateTeam } = useUpdateTeams(team.id);

  const [selectedMemberFrom, setSelectedAdminRoleMemberFrom] = useState<any>();
  const [selectedMemberTo, setSelectedAdminRoleMemberTo] = useState<any>();

  const [teamName, setTeamName] = useState(team.name);
  const [actualTeamName, setActualTeamName] = useState(team.name);

  const [errorTeamName, setErrorTeamName] = useState(false);
  const [errorMembers, setErrorMembers] = useState(false);

  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const [showTransferModal, setShowTransferModal] = useState(false);

  const onTransferRoles = useCallback(async () => {
    if (userData) {
      if (selectedMemberFrom === undefined || selectedMemberTo === undefined) {
        setErrorMembers(true);
      } else {
        if (
          selectedMemberFrom !== null &&
          selectedMemberTo !== null &&
          selectedMemberFrom?.id !== '' &&
          selectedMemberTo?.id !== ''
        ) {
          setErrorMembers(false);

          const body = {
            name: actualTeamName,
            organization: organizationId,
            id: team.id,
          };

          const promise = updateTeam(body)
            .then((res: any) => {
              if (res.success) {
                setRefetchTrigger((prev) => prev + 1);
              } else {
                toaster.error(res.message);
              }
            })
            .catch((e) => {
              console.log('ERROR onTransferRoles', e);
            });

          await toaster.promise(promise, {
            loading: 'Transfering members roles',
            success: 'Roles have been transfered',
            error: 'Error transfering roles',
          });
        } else {
          setErrorMembers(true);
        }
      }
    }
  }, [
    actualTeamName,
    organizationId,
    selectedMemberTo,
    selectedMemberFrom,
    userData,
    team,
    updateTeam,
  ]);

  const onUpdateTeamName = useCallback(async () => {
    if (teamName !== '' && userData) {
      const body = {
        name: teamName,
        toAdmin: '',
        toMember: '',
        organization: organizationId,
        organizationName: organizationName,
        id: team.id,
        adminName: userData.name + ' ' + userData.lastName,
      };

      const promise = updateTeam(body)
        .then((res: any) => {
          if (res.success) {
            setActualTeamName(teamName);
          } else {
            toaster.error(res.message);
          }
        })
        .catch((e) => {
          console.log('ERROR onUpdateTeam', e);
        });

      await toaster.promise(promise, {
        loading: 'Updating team name',
        success: 'Team name has been updated',
        error: 'Error updating team name',
      });
    } else {
      if (teamName === '') {
        setErrorTeamName(true);
      } else {
        setErrorTeamName(false);
      }
    }
  }, [teamName, organizationId, userData, organizationName, team, updateTeam]);

  const canDeleteTeam =
    totalTeams > 1 && currentUserRole === MembershipRole.Admin;

  return (
    <div className="space-y-6">
      <div className="md:flex space-y-2 md:space-y-0 justify-between">
        <p className="font-semibold">Edit Team</p>
        <div className="flex space-x-2">
          <button
            onClick={() => setUpdateTeams(false)}
            className="flex bg-[#F4F4F5] px-4 py-2 space-x-2 rounded-md hover:bg-gray-50"
          >
            <Image className="my-auto" src={arrowLeft} alt="arrowLeft"></Image>
            <p className="text-sm">Back to team list</p>
          </button>
        </div>
      </div>
      <div className="space-y-8">
        <div className="space-y-2 bg-gray-50 p-8 w-full">
          <p className="text-sm">Team Name</p>
          <input
            onChange={(e) => setTeamName(e.target.value)}
            value={teamName}
            className="w-full border border-[#E4E4E7] py-1 px-3 rounded-md"
          ></input>
          <p className="text-xs font-normal text-[#71717A]">
            Update your team name
          </p>
          {errorTeamName && (
            <p className="text-red-500">Please fill out team name input</p>
          )}
          <div className="w-full flex">
            <button
              onClick={onUpdateTeamName}
              type="button"
              className="text-sm bg-black hover:bg-zinc-600 disabled:bg-gray-500  py-2 mt-auto text-white px-4 rounded-md"
            >
              Update Team Name
            </button>
          </div>
        </div>
        {/*  <div className="space-y-2 bg-gray-50 p-8 w-full">
          <div className="space-y-2">
            <p className="text-sm">Transfer Admin Role From</p>
            <div className="md:w-1/2">
              <TeamMembersSelector
                selectedMember={selectedMemberFrom}
                setFilterMember={setSelectedAdminRoleMemberFrom}
                organizationId={organizationId}
                teamId={team.id}
                type={1}
                refetchTrigger={refetchTrigger}
                resetInput={resetInput}
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm">To</p>
            <div className="md:w-1/2">
              <TeamMembersSelector
                selectedMember={selectedMemberTo}
                setFilterMember={setSelectedAdminRoleMemberTo}
                organizationId={organizationId}
                teamId={team.id}
                type={0}
                refetchTrigger={refetchTrigger}
                resetInput={resetInput}
              />
            </div>

            <p className="text-xs font-normal text-[#71717A]">
              Select the member you would like to transfer the Admin role to
            </p>
          </div>
          {errorMembers && (
            <div>
              <p className="text-red-500">
                Please select a member on both fields
              </p>
            </div>
          )}
          <button
            onClick={showTransferModalHandler}
            type="button"
            className="text-sm bg-black text-white px-4 py-2 rounded-md"
          >
            Transfer roles
          </button>
        </div>*/}
        <If condition={canDeleteTeam}>
          <div className="border-t pt-10 space-y-4">
            <p className="text-xl font-medium">Delete this Team</p>
            <p className="text-sm text-[#71717A] font-normal">
              Deleting this team from your organization. All the data related to
              this team will be deleted and you will not be able to recover it.
            </p>
            <button
              onClick={showModalHandler}
              className="flex w-auto space-x-2 items-center justify-center bg-[#EF4444] hover:bg-red-400 text-white py-2 px-3 rounded-md"
            >
              <Image src={trash} alt="trash"></Image>
              <p>Delete</p>
            </button>
          </div>
        </If>
      </div>
      <CancelContinueModal
        title="Transfer roles"
        message={`<p>Are you sure you want to transfer Admin role from${' '}<b>${selectedMemberFrom?.name}</b> to${' '}<b>${selectedMemberTo?.name}</b></p>`}
        showModal={showTransferModal}
        setShowModal={setShowTransferModal}
        confirmAction={onTransferRoles}
        typeMessage="html"
        confirmMessage="Transfer"
      />
    </div>
  );
}
