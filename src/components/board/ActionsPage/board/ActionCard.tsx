import { useState, useEffect, useRef } from 'react';
import toaster from 'react-hot-toast';

import { Task } from '~/lib/actions/types/actions';
import vector from 'public/assets/svg/3-dots.svg';
import DeleteModal from '~/components/shared/deleteModal';
import Card from '~/components/shared/action/card';
import UpdateActionCard from '~/components/shared/action/updateCard';
import UpdateActions from '~/lib/board/hooks/use-update-action';
import useDeleteAction from '~/lib/board/hooks/use-delete-action';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import TeamAsigneeSelector from '~/components/actions/TeamAsigneeSelector';
import CustomDatePicker from '~/components/shared/datepicker';

import { showDatePickerValue } from '~/components/utils/dateformatter';
import { ActionCardProps } from '~/lib/board/types/types';
import { useUserSession } from '~/core/hooks/use-user-session';
import useArchiveActions from '~/lib/board/hooks/use-archive-action';

import { boardPermissions } from '~/components/utils/boardPermissions';

function ActionCard({
  action,
  deleteTask,
  updateTask,
  archiveTask,
  organizationId,
  teamMembers,
  index,
  retrospectiveId,
  active,
  retrospective,
  rules,
  currentUserRole,
  editCard,
  setEditCard,
  refetchTeamMembers,
  loadingMembers,
  organizationData
}: ActionCardProps) {
  const [task, setTask] = useState<Task | undefined>();

  let date = undefined;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const [description, setDescription] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  const [status, setStatus] = useState('');

  const { trigger: updateActions } = UpdateActions();
  const { trigger: archiveActions } = useArchiveActions();
  const { trigger: deleteActions } = useDeleteAction(
    organizationId,
    retrospectiveId,
    action.id,
  );

  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const [isAllowedToUpdate, setIsAllowedToUpdate] = useState(true);
  const [isAllowedToDelete, setIsAllowedToDelete] = useState(true);
  const [isAllowedToGrab, setIsAllowedToGrab] = useState(true);

  const user = useUserSession();
  const facilitator = user?.auth?.uid as string;

  const isAnonymous = user?.auth?.isAnonymous;
  const userEmail = user?.auth?.email;

    useEffect(() => {
      if (rules && action) {
        const permissions = boardPermissions(
          retrospective,
          rules,
          currentUserRole,
          action,
          facilitator,
          isAnonymous || !userEmail,
          true
        );
  
        setIsAllowedToUpdate(permissions.isAllowedToUpdate);
        setIsAllowedToDelete(permissions.isAllowedToDelete);
        setIsAllowedToGrab(permissions.isAllowedToGrab)
      } else {
        setIsAllowedToUpdate(true);
        setIsAllowedToDelete(true);
      }
    }, [rules, currentUserRole, action]);

  const closeDeleteModalHandler = () => {
    setShowDeleteModal(false);

    const dashboardElement = document.getElementById('actions');
    if (dashboardElement) {
      dashboardElement.removeAttribute('class');
    }
  };

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task?.id ?? '',
    data: {
      type: 'Action',
      task,
    },
    disabled: editMode,
    animateLayoutChanges: () => false,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const UpdateAction = async (type: string) => {
    const body = {
      id: action.id,
      description: description,
      assignee: selectedMember,
      organization: organizationId,
      date: selectedDate ? selectedDate : '',
      order: action.order,
      teamId: action.team,
      retrospectiveId: retrospectiveId,
      facilitator: facilitator,
      status: status,
    };

    const promise = updateActions(body)
      .then((res: any) => {
        if (res.success) {
          setEditMode(false);
          updateTask(action.id, res.data);
          setEditCard('');
        }
      })
      .catch((e) => {
        console.error('ERROR updateActions', e);
      });
    if (type === 'member') {
      await toaster.promise(promise, {
        loading: 'Updating Assignee',
        success: 'Assignee Updated',
        error: 'Error updating assignee',
      });
    } else if (type === 'date') {
      await toaster.promise(promise, {
        loading: 'Updating Due Date',
        success: 'Due Date Updated',
        error: 'Error updating due date',
      });
    } else {
      await toaster.promise(promise, {
        loading: 'Updating Action',
        success: 'Action has been updated',
        error: 'Error updating action',
      });
    }
  };

  const UpdateActionHandler = async (type: string, value: string) => {
    const body = {
      id: action.id,
      description: description,
      assignee: type === 'member' ? value : action.assignee,
      organization: organizationId,
      date: type === 'date' ? value : action.date,
      order: action.order,
      teamId: action.team,
      retrospectiveId: retrospectiveId,
      facilitator: facilitator,
      status: status,
    };

    const promise = updateActions(body)
      .then((res: any) => {
        if (res.success) {
          setEditMode(false);
          updateTask(action.id, res.data);
          setEditCard('');
        }
      })
      .catch((e) => {
        console.error('ERROR updateActions', e);
      });
    if (type === 'member') {
      await toaster.promise(promise, {
        loading: 'Updating Assignee',
        success: 'Assignee Updated',
        error: 'Error updating assignee',
      });
    } else if (type === 'date') {
      await toaster.promise(promise, {
        loading: 'Updating Due Date',
        success: 'Due Date Updated',
        error: 'Error updating due date',
      });
    } else {
      await toaster.promise(promise, {
        loading: 'Updating comment',
        success: 'Comment has been updated',
        error: 'Error updating comment',
      });
    }
  };

  const DeleteAction = async () => {
    const body = {
      id: task?.id,
      organization: organizationId,
      teamId: task?.team,
    };
    const promise = deleteActions(body)
      .then((res: any) => {
        if (task?.id !== undefined && res.success) {
          deleteTask(task.id);
          closeDeleteModalHandler();
        }
      })
      .catch((e) => {
        console.error('ERROR deleteActions', e);
      });
    await toaster.promise(promise, {
      loading: 'Deleting action',
      success: 'Action has been deleted',
      error: 'Error deleting action',
    });
  };

  const ArchiveAction = async (archive: boolean) => {
    const body = {
      id: task?.id,
      organization: organizationId,
      retrospectiveId: retrospectiveId,
      archive: archive,
    };
    const promise = archiveActions(body)
      .then((res: any) => {
        if (task?.id !== undefined && res.success) {
          archiveTask(task.id, true);
          setShowArchiveModal(false);
        }
      })
      .catch((e) => {
        console.error('ERROR deleteActions', e);
      });
    await toaster.promise(promise, {
      loading: 'Archiving action',
      success: 'Action has been archived',
      error: 'Error archiving action',
    });
  };

  useEffect(() => {
    if (action) {
      setTask(action);
      setStatus(action.status);
    }
  }, [action]);

  useEffect(() => {
    if (task) {
      setDescription(task.description);
      setSelectedMember(task.assignee);

      date = showDatePickerValue(task.date);

      setSelectedDate(date);
    }
  }, [task]);

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="w-min-[350px] tv:w-min-[400px]"
      >
        <div className="relative cursor-grab opacity-50">
          <div className=" bg-white p-6 border rounded-md shadow-sm">
            <div className="flex justify-between w-full">
              <p
                className="overflow-hidden flex-grow flex-shrink min-w-0 max-w-[275px] my-auto w-full cursor-pointer overflow-hidden"
                style={{
                  textOverflow: 'ellipsis',
                  WebkitLineClamp: 2,
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  overflowWrap: 'anywhere',
                }}
              >
                {description}
              </p>
              <button className="flex  w-h w-6">
                <Image className="ml-auto" src={vector} alt="menu vector" />
              </button>
            </div>
            <div className="mt-6 xl:flex w-full">
              <div className="w-full">
                <TeamAsigneeSelector
                  membersData={teamMembers}
                  selectedMember={selectedMember}
                  setSelectedMember={setSelectedMember}
                  organizationId={organizationId}
                />
              </div>
              <div className="w-full cursor-pointer xl:flex xl:justify-end">
                <CustomDatePicker
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (editCard === action.id) {
    return (
      <div className="w-min-[350px] tv:w-min-[400px]">
        <UpdateActionCard
          status={status}
          setStatus={setStatus}
          description={description}
          setDescription={setDescription}
          teamMembers={teamMembers}
          selectedMember={selectedMember}
          setSelectedMember={setSelectedMember}
          organizationId={organizationId}
          index={index}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          setShowDeleteModal={setShowDeleteModal}
          UpdateAction={UpdateAction}
          isBoard={true}
          setEditCard={setEditCard}
          refetchTeamMembers={refetchTeamMembers}
          loading={loadingMembers}
        />
      </div>
    );
  }

  return (
    <div
      ref={isAllowedToGrab ? setNodeRef : null}
      style={isAllowedToGrab ? style : undefined}
      {...(isAllowedToGrab ? { ...attributes } : {})}
      {...(isAllowedToGrab ? { ...listeners } : {})}
      className="w-min-[350px] tv:w-min-[400px] cursor-grab"
      id={`card${index}`}
    >
      <Card
        setEditMode={setEditMode}
        description={description}
        teamMembers={teamMembers}
        selectedMember={selectedMember}
        setSelectedMember={(newAssignee) => {
          setSelectedMember(() => {
            UpdateActionHandler('member', newAssignee);
            return newAssignee;
          });
        }}
        organizationId={organizationId}
        selectedDate={selectedDate}
        setSelectedDate={(newDate: any) => {
          setSelectedDate(() => {
            UpdateActionHandler('date', newDate);
            return newDate;
          });
        }}
        setShowDeleteModal={setShowDeleteModal}
        active={active}
        author={action.author}
        isBoard={true}
        isAllowedToUpdate={isAllowedToUpdate}
        isAllowedToDelete={isAllowedToDelete}
        editCard={editCard}
        setEditCard={setEditCard}
        id={action.id}
        refetchTeamMembers={refetchTeamMembers}
        loading={loadingMembers}
        ArchiveAction={setShowArchiveModal}
        isArchive={action.archive}
        organizationData={organizationData}
        teamId={action.team}
        jiraUrl={action?.jiraURl}
        retrospectiveId={retrospectiveId}
      />
      <DeleteModal
        title="Archvie action?"
        message="Are you sure you want to archive this action Item?"
        confirmMessage="Archive"
        cancelMessage="Cancel"
        showModal={showArchiveModal}
        setShowModal={setShowArchiveModal}
        confirmAction={() => ArchiveAction(true)}
        cancelAction={() => {
          setShowArchiveModal(false);
        }}
      />
      <DeleteModal
        title="Delete action?"
        message="Are you sure you want to delete this action Item?"
        confirmMessage="Delete"
        cancelMessage="Cancel"
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        confirmAction={DeleteAction}
        cancelAction={() => {
          setShowDeleteModal(false);
        }}
      />
    </div>
  );
}

export default ActionCard;
