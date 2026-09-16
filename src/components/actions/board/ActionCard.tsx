import { useState, useEffect, useRef } from 'react';
import toaster from 'react-hot-toast';

import { Task, ActionCardProps } from '~/lib/actions/types/actions';

import useUpdateActions from '~/lib/actions/hooks/update-actions';
import useDeleteActions from '~/lib/actions/hooks/delete-actions';
import useArchiveActions from '~/lib/actions/hooks/use-archive-actions';

import DeleteModal from '~/components/shared/deleteModal';
import Card from '~/components/shared/action/card';
import UpdateActionCard from '~/components/shared/action/updateCard';
import { showDatePickerValue } from '~/components/utils/dateformatter';
import { useAuth } from 'reactfire';

function ActionCard({
  action,
  deleteTask,
  updateTask,
  organizationId,
  teamId,
  archiveTask,
  teamMembers,
  index,
  editCard,
  setEditCard,
  refetchTeamMembers,
  loadingMembers,
  organizationData
}: ActionCardProps) {
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const closeDeleteModalHandler = () => {
    setShowDeleteModal(false);

    const dashboardElement = document.getElementById('actions');
    if (dashboardElement) {
      dashboardElement.removeAttribute('class');
    }
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
      order: action.order,
      teamId: action.team,
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
      teamId: task?.team,
    };

    const promise = archiveActions(body)
      .then((res: any) => {
        if (res.success) {
          archiveTask(action?.id, true);
        }
      })
      .catch((e) => {
        console.log('ERROR ArchiveAction', e);
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
      teamId: task?.team,
    };
    const promise = DeleteActions(body)
      .then(() => {
        if (task?.id !== undefined) {
          deleteTask(task.id);
          closeDeleteModalHandler();
        }
      })
      .catch((e) => {
        console.log('ERROR deleteActions', e);
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

  if (editCard === action.id) {
    return (
      <div className="mx-auto">
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
          loading={loadingMembers}
        />
      </div>
    );
  }

  return (
    <div className="m-auto">
      <Card
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
        active={false}
        author={action.author}
        editCard={editCard}
        setEditCard={setEditCard}
        id={action.id}
        refetchTeamMembers={refetchTeamMembers}
        loading={loadingMembers}
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

export default ActionCard;
