import { useState, useEffect, useRef } from 'react';
import toaster from 'react-hot-toast';

import vector from 'public/assets/svg/3-dots.svg';

import { Task, Id } from '~/lib/actions/types/actions';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import Image from 'next/image';

import TeamAsigneeSelector from '../TeamAsigneeSelector';

import CustomDatePicker from '~/components/shared/datepicker';
import DeleteModal from '~/components/shared/deleteModal';

import useUpdateActions from '~/lib/actions/hooks/update-actions';
import useDeleteActions from '~/lib/actions/hooks/delete-actions';
import useArchiveActions from '~/lib/actions/hooks/use-archive-actions';
import { TeamMembers } from '~/lib/teams/types/teams';

import ActionCard from '~/components/shared/action/card';
import UpdateActionCard from '~/components/shared/action/updateCard';
import { showDatePickerValue } from '~/components/utils/dateformatter';
import { useAuth } from 'reactfire';

interface Props {
  action: Task;
  organizationId: string;
  teamId: string;
  deleteTask: (id: Id) => void;
  updateTask: (id: string, content: Task) => void;
  archiveTask: (id: string, archive: boolean) => void;
  index: string;
  teamMembers: TeamMembers[] | any[] | null;
  active?: boolean;
  editCard: any;
  setEditCard: (card: any) => void;
  refetchTeamMembers: (searchableText: string) => void;
  loading: boolean;
  organizationData: any;
}

function TaskCard({
  action,
  deleteTask,
  updateTask,
  organizationId,
  teamId,
  archiveTask,
  index,
  teamMembers,
  active = false,
  editCard,
  setEditCard,
  refetchTeamMembers,
  loading,
  organizationData,
}: Props) {
  const [task, setTask] = useState<Task | undefined>();

  const auth = useAuth();
  const currentUser = auth.currentUser?.uid as string;

  let date = undefined;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const prevSelectedDateRef = useRef<Date | undefined>(date);

  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>();
  const prevSelectedMemberRef = useRef<string | undefined>(undefined);

  const { trigger: updateActions } = useUpdateActions(organizationId);
  const { trigger: DeleteActions } = useDeleteActions(
    organizationId,
    action.id,
    teamId,
  );
  const { trigger: archiveActions } = useArchiveActions(organizationId);

  const [editMode, setEditMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showFullText, setShowFullText] = useState(false);

  const handleClick = () => {
    setShowFullText(!showFullText);
  };

  const closeDeleteModalHandler = () => {
    setShowDeleteModal(false);
  };

  const UpdateAction = async (archive: boolean, type: string) => {
    const body = {
      id: action.id,
      description: description,
      assignee: selectedMember,
      organization: organizationId,
      date: selectedDate ? selectedDate : '',
      status: status,
      archive: archive,
      teamId: teamId,
      order: action.order,
      facilitator: currentUser,
    };
    const promise = updateActions(body)
      .then((res: any) => {
        if (res.success) {
          updateTask(action.id, res.data);
          setEditMode(false);
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
        loading: 'Updating action',
        success: 'Action has been updated',
        error: 'Error updating action',
      });
    }
  };

  const ArchiveAction = async (archive: boolean) => {
    const body = {
      id: task?.id,
      archive: archive,
      organization: organizationId,
      teamId: teamId,
    };

    const promise = archiveActions(body)
      .then((res: any) => {
        if (res.success) {
          archiveTask(action?.id, true);
        }
      })
      .catch((e) => {
        console.error('ERROR ArchiveAction', e);
      });
    await toaster.promise(promise, {
      loading: 'Archiving action',
      success: 'Action has been archived',
      error: 'Error archiving action',
    });
  };

  const DeleteAction = async () => {
    const body = {
      id: task?.id,
      organization: organizationId,
    };
    const promise = DeleteActions(body)
      .then(() => {
        if (task?.id !== undefined) {
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

  useEffect(() => {
    if (action) {
      setTask(action);
    }
  }, [action]);

  useEffect(() => {
    if (task) {
      setDescription(task.description);
      setSelectedMember(task.assignee);
      setStatus(task.status);

      date = showDatePickerValue(task.date);

      setSelectedDate(date);
      prevSelectedDateRef.current = date;
      prevSelectedMemberRef.current = task.assignee;
    }
  }, [task]);

  useEffect(() => {
    if (action.id !== editCard) {
      if (task && selectedMember !== prevSelectedMemberRef.current) {
        UpdateAction(false, 'member');
        prevSelectedMemberRef.current = selectedMember;
      }
    }
  }, [selectedMember]);

  useEffect(() => {
    if (action.id !== editCard) {
      const seletedDateTime = selectedDate?.getTime();
      const refSelectedTime = prevSelectedDateRef.current?.getTime();

      if (task && refSelectedTime !== seletedDateTime) {
        UpdateAction(false, 'date');
        prevSelectedDateRef.current = selectedDate;
      }
    }
  }, [selectedDate]);

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
      type: 'Task',
      task,
    },
    disabled: editMode,
    animateLayoutChanges: () => false,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (editCard === action.id) {
    return (
      <div className="md:w-[350px] tv:w-[400px] mx-auto" id={`card${index}`}>
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
          setEditCard={setEditCard}
          refetchTeamMembers={refetchTeamMembers}
          loading={loading}
        />
      </div>
    );
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="md:w-[350px] tv:w-[400px]"
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
                onClick={handleClick}
              >
                {description}
              </p>
              <button
                className="flex  w-h w-6"
                onClick={() => setShowMenu(!showMenu)}
              >
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="md:w-[350px] tv:w-[400px] cursor-grab"
      id={`card${index}`}
    >
      <ActionCard
        setEditMode={setEditMode}
        description={description}
        teamMembers={teamMembers}
        selectedMember={selectedMember}
        setSelectedMember={setSelectedMember}
        organizationId={organizationId}
        organizationData={organizationData}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        setShowDeleteModal={setShowDeleteModal}
        ArchiveAction={ArchiveAction}
        active={active}
        author={action.author}
        setEditCard={setEditCard}
        editCard={editCard}
        id={action.id}
        refetchTeamMembers={refetchTeamMembers}
        loading={loading}
        isArchive={action.archive}
        teamId={action.team}
        jiraUrl={action?.jiraURl}
      />
      <DeleteModal
        message="Are you sure you want to delete this action Item?"
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        confirmAction={DeleteAction}
      />
    </div>
  );
}

export default TaskCard;
