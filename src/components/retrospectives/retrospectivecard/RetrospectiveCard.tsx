import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Badge from './elements/Badge';
import MembersButton from './elements/MembersButton';
import PublicButton from './elements/PublicButton';

import DeleteModal from '~/components/shared/deleteModal';
import ContextMenu from '~/components/shared/contextMenu';
import BlurPortal from '~/components/shared/blurPortal';
import { showDate } from '~/components/utils/dateformatter';
import { InformationModal } from '~/components/shared/informationModal';

import MembersCard from '../MembersCard';
import MoveMembersModal from '../MoveMembersModal';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { useGetBoardByRetrospectiveId } from '~/lib/board/hooks/use-get-board-by-retrospective';
import useFetchActions from '~/lib/server/board/get-actions';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import { Rules } from '~/lib/rules/types';

import archive from '/public/assets/svg/archive.svg';
import archiveRestore from '/public/assets/svg/archive-restore.svg';
import trash from '/public/assets/svg/trash.svg';
import eyeOpen from 'public/assets/svg/eye-open.svg';
import eyeClosed from 'public/assets/svg/eye-closed.svg';
import team from 'public/assets/svg/users.svg';

import If from '~/core/ui/If';

import { TeamMembers } from '~/lib/teams/types/teams';
import { useCurrentUserRole } from '~/lib/organizations/hooks/use-current-user-role';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

interface RetrospectiveCardProps {
  open: boolean;
  title: string;
  date?: Date; //TODO: Set as optional for development porpuses
  name: string;
  isPublic: boolean;
  id: string;
  isArchived: boolean;
  onDelete: (retrospectiveId: string) => void;
  onPatch: (data: Partial<Retrospectives>) => void;
  rules: Rules;
  userId: string;
  isAnonymous: boolean;
  isFacilitator: boolean;
  submit?: () => void;
  totalTeams: number;
}

export default function RetrospectiveCard({
  open,
  title,
  date = new Date(),
  name,
  isPublic,
  id,
  isArchived,
  onDelete,
  onPatch,
  rules,
  userId,
  isAnonymous,
  isFacilitator,
  submit,
  totalTeams,
}: RetrospectiveCardProps) {
  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  const { retrospective } = useGetBoardByRetrospectiveId(organizationId, id);

  const teamId = retrospective?.teamId;

  const { data: actionsData } = useFetchActions(organizationId, teamId, id);

  const [showDelete, setShowDelete] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showMoveRetrospective, setShowMoveRetrospective] = useState(false);

  const [canDeleteRetrospectives, setCanDeleteRetrospectives] = useState(false);
  const [canArchiveRetrospectives, setCanArchiveRetrospectives] =
    useState(false);

  const [message, setMessage] = useState('');

  const [showInfoModal, setShowInfoModal] = useState(false);

  const { members: _members } = useGetBoardByRetrospectiveId(
    organizationId,
    id,
  );

  const [activeMembers, setActiveMembers] = useState<TeamMembers[] | undefined>(
    _members,
  );

  useEffect(() => {
    if (_members) {
      const active = _members.filter(
        (member: TeamMembers) => member.active === true,
      );
      setActiveMembers(active);
    }
  }, [_members]);

  const router = useRouter();

  function handleDeleteClick() {
    if (canDeleteRetrospectives) {
      setShowDelete(true);
    } else {
      if (canArchiveRetrospectives) {
        setMessage(
          'A completed retrospective board cannot be deleted. However, you can archive this board.',
        );
      } else {
        setMessage('A completed retrospective board cannot be deleted.');
      }

      setShowInfoModal(true);
    }
  }

  function handleArchiveClick() {
    if (canArchiveRetrospectives || isArchived) {
      setShowArchive(true);
    } else {
      setMessage('Retrospective board cannot be archived');
      setShowInfoModal(true);
    }
  }

  function handleTeamClick() {
    setShowMembers(true);
  }

  function handleMoveTeamClick() {
    setShowMoveRetrospective(true);
  }

  function handleConfirmDelete() {
    const promise = new Promise<void>((resolve, reject) => {
      try {
        onDelete(id);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    toast.promise(promise, {
      loading: 'Deleting retrospective...',
      success: 'Retrospective deleted successfully',
      error: 'Failed to delete retrospective. Please try again later.',
    });
    setShowDelete(false);
  }

  function handleConfirmArchive() {
    const promise = new Promise<void>((resolve, reject) => {
      try {
        onPatch({ archived: !isArchived, id: id });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    toast.promise(promise, {
      loading: `${isArchived ? 'Restoring' : 'Archiving'} retrospective...`,
      success: `Retrospective ${
        isArchived ? 'restored' : 'archived'
      } successfully`,
      error: `Failed to ${
        isArchived ? 'restore' : 'archive'
      } retrospective. Please try again later.`,
    });
    setShowArchive(false);
  }

  function handlePublicClick() {
    const promise = new Promise<void>((resolve, reject) => {
      try {
        onPatch({ access: { type: isPublic ? 'private' : 'public' }, id: id });
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: 'Updating access...',
      success: isPublic
        ? 'Retrospective Set to Private'
        : 'Retrospective Set to Public',
      error: 'Failed to update access!',
    });
  }

  useEffect(() => {
    
    if (retrospective && rules) {
      if (retrospective.finished) {
        setCanDeleteRetrospectives(!!rules.canDeleteCompletedRetrospective);
        setCanArchiveRetrospectives(!!rules.canArchiveCompletedRetrospective);
      } else {
        setCanDeleteRetrospectives(!!rules.canDeleteUncompletedRetrospective);
        setCanArchiveRetrospectives(!!rules.canArchiveUncompletedRetrospective);
      }
    }
  }, [retrospective, rules]);

  const menuOptions = [
    {
      name: 'Delete',
      action: handleDeleteClick,
      icon: trash,
    },
    {
      name: isArchived ? 'Restore' : 'Archive',
      action: handleArchiveClick,
      icon: isArchived ? archiveRestore : archive,
    },
    {
      name: !isPublic ? 'Public' : 'Private',
      action: handlePublicClick,
      icon: !isPublic ? eyeOpen : eyeClosed,
    },
    ...(totalTeams > 1
      ? [
          {
            name: 'Team',
            action: handleMoveTeamClick,
            icon: team,
          },
        ]
      : []),
  ];

  const currentUserRole = useCurrentUserRole();

  return (
    <div
      className={
        'border border-[#E4E4E7] rounded-lg p-6 bg-white hover:bg-zinc-50'
      }
    >
      <div className={'flex justify-between pb-6'}>
        <Badge open={open} />
        <If
          condition={
            !isAnonymous &&
            (isFacilitator || currentUserRole === MembershipRole.Admin)
          }
        >
          <div
            className="cursor-pointer relative"
            onClick={() => setShowOptions(!showOptions)}
          >
            <ContextMenu options={menuOptions} />
            {showOptions && (
              <div className="flex flex-col absolute">
                <Image
                  src={archive}
                  alt="archive"
                  className="mr-3 cursor-pointer"
                  onClick={handleArchiveClick}
                />{' '}
                <Image
                  src={trash}
                  alt="trash"
                  className="cursor-pointer"
                  onClick={handleDeleteClick}
                />
              </div>
            )}
          </div>
        </If>
      </div>
      <Link href={`/board/${id}`}>
        <div className="pb-6">
          <h3 className="font-bold text-xl whitespace-nowrap overflow-hidden text-ellipsis">
            {name}
          </h3>
          <div className="text-sm text-gray-500">{showDate(date)}</div>
        </div>
        <div className="mb-4">
          <h4 className="text-sm font-medium text-zinc-900 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
            {title}
          </h4>
          <div className="text-sm font-medium text-zinc-500">
            <button
              onClick={(e) => {
                e.preventDefault();
                const actionsLength = actionsData?.length as number;
                if (actionsLength > 0) {
                  router.push(`/board/${id}#actions`);
                }
              }}
              className={`${
                (actionsData?.length as number) > 0 && 'text-blue-500 underline'
              } text-sm font-black`}
            >
              {actionsData?.length}
            </button>{' '}
            Action Items
          </div>
        </div>
      </Link>
      <div className="flex justify-between">
        <MembersButton
          members={activeMembers?.length}
          onClick={handleTeamClick}
        />
        <PublicButton
          isPublic={isPublic}
          onClick={handlePublicClick}
          isFacilitator={!isAnonymous && isFacilitator}
        />
      </div>
      <DeleteModal
        title="Delete retrospective?"
        message="Are you sure you want to delete this retrospective?"
        confirmMessage="Delete"
        cancelMessage="Cancel"
        showModal={showDelete}
        setShowModal={setShowDelete}
        confirmAction={handleConfirmDelete}
        cancelAction={() => {
          setShowDelete(false);
        }}
      />
      <DeleteModal
        title={`${isArchived ? 'Restore' : 'Archive'} retrospective?`}
        message={`Are you sure you want to ${
          isArchived ? 'restore' : 'archive'
        } this retrospective?`}
        confirmMessage={isArchived ? 'Restore' : 'Archive'}
        cancelMessage="Cancel"
        showModal={showArchive}
        setShowModal={setShowArchive}
        confirmAction={handleConfirmArchive}
        cancelAction={() => {
          setShowArchive(false);
        }}
      />
      {showMembers && (
        <BlurPortal>
          <MembersCard
            closeModal={() => {
              setShowMembers(false);
            }}
            activeMembers={activeMembers}
          />
        </BlurPortal>
      )}
      {showMoveRetrospective && (
        <BlurPortal>
          <MoveMembersModal
            retrospectiveId={id}
            closeModal={() => {
              setShowMoveRetrospective(false);
            }}
            userId={userId}
            retrospectiveTeam={retrospective.teamId}
            retrospective={retrospective}
            submit={submit}
          />
        </BlurPortal>
      )}
      {showInfoModal && (
        <InformationModal
          title=""
          description={message}
          closeModalHandler={() => setShowInfoModal(false)}
        ></InformationModal>
      )}
    </div>
  );
}
