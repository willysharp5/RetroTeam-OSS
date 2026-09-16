import React, { useState, useEffect, useRef } from 'react';
import toaster from 'react-hot-toast';

import Image from 'next/image';

import {
  TaskItem as TaskItemProps,
  UpdateSidebarComponentProps,
  UpdateTaskItem,
} from '~/lib/actions/types/actions';
import { Task } from '~/lib/actions/types/actions';

import vector from '/public/assets/svg/3-dots.svg';
import x from 'public/assets/svg/x.svg';
import archive from 'public/assets/svg/archive.svg';
import trash from 'public/assets/svg/trash.svg';
import edit from 'public/assets/svg/edit-3.svg';
import CustomDatePicker from '../shared/datepicker';
import DeleteModal from '../shared/deleteModal';

import useUpdateActions from '~/lib/actions/hooks/update-actions';
import useDeleteActions from '~/lib/actions/hooks/delete-actions';
import useArchiveActions from '~/lib/actions/hooks/use-archive-actions';

import UpdateActions from '~/lib/board/hooks/use-update-action';

import Sidebar from '~/core/ui/SideBarComponent';
import LoadingBar from 'react-top-loading-bar';
import { XCircleIcon } from '@heroicons/react/24/outline';

import UpdateActionCard from '../shared/action/updateCard';
import { showDatePickerValue } from '../utils/dateformatter';
import Paragraph from '../shared/paragraph';
import SearchableAssigneSelector from '../shared/searchableAssigneeSelector';
import { useAuth } from 'reactfire';
import useDeleteAction from '~/lib/board/hooks/use-delete-action';
import If from '~/core/ui/If';

export default function EditActionSidebarComponent({
  setShowSidebar,
  action,
  organizationId,
  teamId,
  refetch,
  teamMembers,
  refetchTeamMembers,
  loadingMembers,
  selectedTab,
  retrospectiveId,
}: UpdateSidebarComponentProps) {
  return (
    <Sidebar>
      <div
        className={`w-[400px] z-50 shadow-lg bg-white h-full fixed top-0 right-0 overflow-y-auto p-6`}
      >
        <div className="flex justify-between">
          <p className="text-sm font-black">Edit Action</p>
          <Image
            className="h-6 w-6 cursor-pointer"
            src={x}
            alt="x"
            onClick={() => setShowSidebar(false)}
          ></Image>
        </div>
        <TaskItem
          key={''}
          action={action}
          organizationId={organizationId}
          teamId={teamId}
          refetch={refetch}
          setShowSidebar={setShowSidebar}
          teamMembers={teamMembers}
          refetchTeamMembers={refetchTeamMembers}
          loading={loadingMembers}
          selectedTab={selectedTab}
          retrospectiveId={retrospectiveId}
        />
      </div>
    </Sidebar>
  );
}

export const TaskItem = React.memo(function TaskItem({
  action,
  organizationId,
  teamId,
  refetch,
  teamMembers,
  setShowSidebar,
  refetchTeamMembers,
  loading,
  selectedTab,
  retrospectiveId,
}: UpdateTaskItem) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [task, setTask] = useState<Task | undefined>();

  let date = undefined;

  const auth = useAuth();
  const currentUser = auth.currentUser?.uid as string;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const prevSelectedDateRef = useRef<Date | undefined>(date);

  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const prevSelectedMemberRef = useRef<string | undefined>(undefined);

  const { trigger: updateActions } = useUpdateActions(organizationId);
  const { trigger: DeleteActions } = useDeleteActions(
    organizationId,
    action.id,
    teamId,
  );
  const { trigger: archiveAction } = useArchiveActions(organizationId);

  const { trigger: updateBoardAction } = UpdateActions();
  const { trigger: deleteBoardAction } = useDeleteAction(
    organizationId,
    retrospectiveId,
    action.id,
  );

  const [editMode, setEditMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editCard, setEditCard] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);

  const toggleEditMode = () => {
    setEditCard(action.id);
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
      teamId: teamId,
      facilitator: currentUser,
    };

    const promise = updateActions(body)
      .then((res: any) => {
        if (res.success) {
          refetch(1);
          setEditCard('');
        }
      })
      .catch((e) => {
        console.log('ERROR updateActions', e);
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

  const UpdateBoardAction = async (type: string) => {
    const body = {
      id: action.id,
      description: description,
      assignee: selectedMember,
      organization: organizationId,
      date: selectedDate ? selectedDate : '',
      order: action.order,
      teamId: action.team,
      retrospectiveId: retrospectiveId,
      facilitator: currentUser,
      status: status,
    };

    const promise = updateBoardAction(body)
      .then((res: any) => {
        if (res.success) {
          refetch(1);
          setEditCard('');
        }
      })
      .catch((e) => {
        console.log('ERROR updateActions', e);
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

  const DeleteAction = async () => {
    const body = {
      id: task?.id,
      organization: organizationId,
    };
    const promise = DeleteActions(body)
      .then(() => {
        if (task?.id !== undefined) {
          refetch(1);
          setShowSidebar(false);
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

  const DeleteBoardAction = async () => {
    const body = {
      id: task?.id,
      organization: organizationId,
      teamId: task?.team,
    };
    const promise = deleteBoardAction(body)
      .then((res: any) => {
        if (task?.id !== undefined && res.success) {
          refetch(1);
          setShowSidebar(false);
        }
      })
      .catch((e) => {
        console.log('ERROR deleteBoardAction', e);
      });
    await toaster.promise(promise, {
      loading: 'Deleting action',
      success: 'Action has been deleted',
      error: 'Error deleting action',
    });
  };

  const ArchiveAction = async () => {
    const body = {
      id: task?.id,
      organization: organizationId,
      archive: true,
      teamId: teamId,
    };
    const promise = archiveAction(body)
      .then(() => {
        if (task?.id !== undefined) {
          refetch(1);
          setShowSidebar(false);
        }
      })
      .catch((e) => {
        console.log('ERROR deleteActions', e);
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
    if (editCard !== action.id && task) {
      if (selectedMember !== prevSelectedMemberRef.current) {
        if (selectedTab === 1) {
          UpdateAction(false, 'member');
        } else {
          UpdateBoardAction('member');
        }
        prevSelectedMemberRef.current = selectedMember;
      }
    }
  }, [selectedMember]);

  useEffect(() => {
    if (editCard !== action.id && task) {
      const seletedDateTime = selectedDate?.getTime();
      const refSelectedTime = prevSelectedDateRef.current?.getTime();

      if (refSelectedTime !== seletedDateTime) {
        if (selectedTab === 1) {
          UpdateAction(false, 'date');
        } else {
          UpdateBoardAction('date');
        }
        prevSelectedDateRef.current = selectedDate;
      }
    }
  }, [selectedDate]);

  const handleClickOutside = (event: any) => {
    if (cardRef.current && !cardRef.current.contains(event.target)) {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (editCard === action.id) {
    return (
      <div className="mt-6" onDoubleClick={() => setEditMode(false)}>
        <UpdateActionCard
          status={status}
          setStatus={setStatus}
          description={description}
          setDescription={setDescription}
          teamMembers={teamMembers}
          selectedMember={selectedMember}
          setSelectedMember={setSelectedMember}
          organizationId={organizationId}
          index={''}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          setShowDeleteModal={setShowDeleteModal}
          UpdateAction={selectedTab === 1 ? UpdateAction : UpdateBoardAction}
          setEditCard={setEditCard}
          hasCloseButton={true}
          refetchTeamMembers={refetchTeamMembers}
          loading={loading}
          isBoard={selectedTab === 2}
        />
      </div>
    );
  }

  return (
    <>
      {task ? (
        <>
          <div
            onDoubleClick={toggleEditMode}
            className="relative mt-6 bg-white hover:bg-gray-50 p-6 border rounded-md shadow-sm"
          >
            <div className="flex justify-between w-full">
              <Paragraph
                description={description}
                onDoubleClickEvent={toggleEditMode}
              />
              <button
                className="flex  w-h w-6"
                onClick={() => setShowMenu(!showMenu)}
              >
                <Image className="ml-auto" src={vector} alt="menu vector" />
              </button>
            </div>
            <div className="mt-6 flex w-full space-x-6">
              <div className="flex w-full">
                <div className="mt-1">
                  <SearchableAssigneSelector
                    refetch={refetchTeamMembers}
                    loading={loading}
                    options={teamMembers}
                    label="fullName"
                    handleChange={setSelectedMember}
                    selectedVal={selectedMember}
                    organizationId={organizationId}
                  />
                </div>

                {selectedMember != 'ml-2' && (
                  <button
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMember('');
                    }}
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="w-full cursor-pointer xl:flex xl:justify-end">
                <CustomDatePicker
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                />
              </div>
            </div>
            {showMenu && (
              <div
                ref={cardRef}
                className="absolute space-y-2 rounded-md py-1.5 px-2 top-10 right-8 z-50 bg-white border shadow-md"
              >
                <button className="flex space-x-2" onClick={toggleEditMode}>
                  <Image src={edit} alt="edit"></Image>
                  <p className="text-sm">Edit</p>
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex space-x-2"
                >
                  <Image src={trash} alt="delete"></Image>
                  <p className="text-sm">Delete</p>
                </button>
                <If condition={selectedTab === 1}>
                  <button
                    onClick={() => ArchiveAction()}
                    className="flex space-x-2"
                  >
                    <Image src={archive} alt="delete"></Image>
                    <p className="text-sm">Archive</p>
                  </button>
                </If>
              </div>
            )}
          </div>
        </>
      ) : (
        <LoadingBar />
      )}
      {showDeleteModal && (
        <DeleteModal
          message="Are you sure you want to delete this action Item?"
          showModal={showDeleteModal}
          setShowModal={setShowDeleteModal}
          confirmAction={selectedTab === 1 ? DeleteAction : DeleteBoardAction}
        />
      )}
    </>
  );
});
