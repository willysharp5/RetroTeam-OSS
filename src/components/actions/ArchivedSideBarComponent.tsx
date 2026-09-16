import React, { useState, useEffect, useRef } from 'react';
import toaster from 'react-hot-toast';

import Image from 'next/image';

import {
  ArchivedSidebarComponentProps,
  TaskItem as TaskItemProps,
} from '~/lib/actions/types/actions';
import { Task } from '~/lib/actions/types/actions';

import vector from '/public/assets/svg/3-dots.svg';
import archiveRestore from '/public/assets/svg/archive-restore.svg';
import x from 'public/assets/svg/x.svg';
import trash from 'public/assets/svg/trash.svg';
import edit from 'public/assets/svg/edit-3.svg';
import calendar from '/public/assets/svg/calendar.svg';

import CustomDatePicker from '../shared/datepicker';
import DeleteModal from '../shared/deleteModal';

import useUpdateActions from '~/lib/actions/hooks/update-actions';
import useDeleteActions from '~/lib/actions/hooks/delete-actions';
import useArchiveActions from '~/lib/actions/hooks/use-archive-actions';

import useUpdateBoardActions from '~/lib/board/hooks/use-update-action';
import useDeleteBoardActions from '~/lib/board/hooks/use-delete-action';
import useArchiveBoardActions from '~/lib/board/hooks/use-archive-action';

import Sidebar from '~/core/ui/SideBarComponent';
import LoadingBar from 'react-top-loading-bar';
import { XCircleIcon } from '@heroicons/react/24/outline';
import UpdateActionCard from '../shared/action/updateCard';
import { showDatePickerValue } from '../utils/dateformatter';
import Paragraph from '../shared/paragraph';
import SearchableAssigneSelector from '../shared/searchableAssigneeSelector';
import { useAuth } from 'reactfire';


import { MembershipRole } from '~/lib/organizations/types/membership-role';
import If from '~/core/ui/If';
import UserImage from '../dashboard/UserImage';
import { TeamMembers } from '~/lib/teams/types/teams';
import useFetchUserById from '~/lib/server/user/get-current-user';

export default function ArchivedSidebarComponent({
  setShowArchivedActionBar,
  data,
  organizationId,
  teamId,
  updateTask,
  deleteTask,
  archiveTask,
  teamMembers,
  refetchTeamMembers,
  loadingMembers,
  showOrgActions,
  currentUser,
  retrospectiveId,
  deleteActions,
  retrospective,
  currentUserRole,
  rules,
}: ArchivedSidebarComponentProps) {
  const [editCard, setEditCard] = useState('');

  const [tasks, setTasks] = useState<Task[] | undefined>();

  useEffect(() => {
    const activeActions = data.filter((task: Task) => task.archive === true);
    setTasks(activeActions);
  }, [data]);

  return (
    <Sidebar>
      <div
        className={`w-full md:w-[450px] z-50 shadow-lg bg-white h-full fixed top-0 right-0 overflow-y-auto p-6`}
      >
        <div className="flex justify-between">
          <p className="text-sm font-black">Archived Items</p>
          <Image
            className="h-6 w-6 cursor-pointer"
            src={x}
            alt="x"
            onClick={() => setShowArchivedActionBar(false)}
          ></Image>
        </div>
        {tasks && tasks.length > 0 ? (
          tasks.map((task, index) => (
            <TaskItem
              key={index}
              action={task}
              organizationId={organizationId}
              teamId={teamId}
              updateTask={updateTask}
              deleteTask={deleteTask}
              archiveTask={archiveTask}
              deleteActions={deleteActions}
              teamMembers={teamMembers}
              editCard={editCard}
              setEditCard={setEditCard}
              refetchTeamMembers={refetchTeamMembers}
              loading={loadingMembers}
              showOrgActions={showOrgActions}
              facilitator={currentUser}
              retrospectiveId={retrospectiveId}
              retrospective={retrospective}
              currentUserRole={currentUserRole}
              rules={rules}
            />
          ))
        ) : (
          <p className="p-8">No archive items</p>
        )}
      </div>
    </Sidebar>
  );
}

export const TaskItem = React.memo(function TaskItem({
  action,
  organizationId,
  teamId,
  updateTask,
  deleteTask,
  archiveTask,
  deleteActions,
  teamMembers,
  editCard,
  setEditCard,
  refetchTeamMembers,
  loading,
  showOrgActions,
  retrospectiveId,
  facilitator,
  rules,
  retrospective,
  currentUserRole,
}: TaskItemProps) {
  const [isAllowedToUpdate, setIsAllowedToUpdate] = useState(true);
  const [isAllowedToDelete, setIsAllowedToDelete] = useState(true);

  useEffect(() => {
    if (!retrospectiveId || !rules  || showOrgActions) return;

    const isFacilitator = currentUserRole === MembershipRole.Facilitator;
    const isAuthor = action.author === facilitator;
    const isFinished = retrospective.finished;

    let canUpdate = false;
    let canDelete = false;

    if (isFinished) {
      canUpdate = rules.allowUpdateCardsOnceFinished;
      canDelete = rules.allowDeleteCardsOnceFinished;
    } else {
      if (isFacilitator) {
        canUpdate = true;
        canDelete = true;
      } else if (isAuthor) {
        canUpdate = true;
        canDelete = true;
      }
    }

    setIsAllowedToUpdate(canUpdate);
    setIsAllowedToDelete(canDelete);
  }, [retrospective, rules, currentUserRole, action.assignee, facilitator]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const closeDeleteModalHandler = () => {
    setShowDeleteModal(false);

    const dashboardElement = document.getElementById('actions');
    if (dashboardElement) {
      dashboardElement.removeAttribute('class');
    }
  };

  const [task, setTask] = useState<Task | undefined>();

  const auth = useAuth();
  const currentUser = auth.currentUser?.uid as string;

  let date = undefined;

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
  const { trigger: archiveActions } = useArchiveActions(organizationId);

  const { trigger: updateBoardActions } = useUpdateBoardActions();
  const { trigger: deleteBoardActions } = useDeleteBoardActions(
    organizationId,
    retrospectiveId,
    action.id,
  );
  const { trigger: archiveBoardActions } = useArchiveBoardActions();

  const [selectedMemberData, setSelectedMemberData] = useState<
  TeamMembers | undefined
>(undefined);

const userData = useFetchUserById(selectedMember);

useEffect(() => {
  if (userData) {
    setSelectedMemberData(userData);
  }
}, [userData]);

const [isDatePast, setIsDatePast] = useState(false);

useEffect(() => {
  if (!isAllowedToUpdate && selectedDate) {
    const today = new Date();
    const isDatePast = selectedDate < today;
    setIsDatePast(isDatePast);
  }
}, [teamMembers, isAllowedToUpdate, selectedMember, selectedDate]);

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
      facilitator: facilitator,
      status: status,
    };

    const promise = updateBoardActions(body)
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

  const DeleteBoardAction = async () => {
    const body = {
      id: task?.id,
      organization: organizationId,
      teamId: task?.team,
    };
    const promise = deleteBoardActions(body)
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

  const ArchiveBoardAction = async (archive: boolean) => {
    const body = {
      id: task?.id,
      organization: organizationId,
      retrospectiveId: retrospectiveId,
      archive: archive,
    };

    const promise = archiveBoardActions(body)
      .then((res: any) => {
        if (task?.id !== undefined && res.success) {
          archiveTask(task.id, false);
        }
      })
      .catch((e) => {
        console.error('ERROR deleteActions', e);
      });
    await toaster.promise(promise, {
      loading: 'Restoring action',
      success: 'Action has been restored',
      error: 'Error restoring action',
    });
  };

  const [editMode, setEditMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const toggleEditMode = () => {
    setEditCard(action.id);
    setShowMenu((prev) => !prev);
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
        loading: 'Updating Action',
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
        archiveTask(action?.id, false);
      })
      .catch((e) => {
        console.error('ERROR archive Actions', e);
      });
    await toaster.promise(promise, {
      loading: 'Restoring action',
      success: 'Action has been restored',
      error: 'Error restoring action',
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
        if (showOrgActions) {
          UpdateAction(true, 'member');
        } else {
          UpdateBoardAction('member');
        }

        prevSelectedMemberRef.current = selectedMember;
      }
    }
  }, [selectedMember]);

  useEffect(() => {
    if (task && editCard !== action.id) {
      const seletedDateTime = selectedDate?.getTime();
      const refSelectedTime = prevSelectedDateRef.current?.getTime();

      if (refSelectedTime !== seletedDateTime) {
        if (showOrgActions) {
          UpdateAction(true, 'date');
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

  const formatDate = (date: Date | undefined) => {
    if (!date) {
      return 'No due date';
    }
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  };

  if (editCard === action.id) {
    return (
      <div className="mt-6">
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
          UpdateAction={showOrgActions ? UpdateAction : UpdateBoardAction}
          setEditCard={setEditCard}
          refetchTeamMembers={refetchTeamMembers}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <>
      {task ? (
        <>
          <div
            onDoubleClick={() => {
              if (isAllowedToUpdate) setEditCard(action.id);
            }}
            className="relative hover:bg-zinc-50 mt-6 bg-white p-6 border rounded-md shadow-sm"
          >
            <div className="flex justify-between w-full">
              <Paragraph
                description={description}
                onDoubleClickEvent={() => {
                  if (isAllowedToUpdate) {
                    setEditCard(action.id);
                  }
                }}
              />
              <If condition={isAllowedToUpdate || isAllowedToDelete}>
                <button
                  className="flex  w-h w-6"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <Image className="ml-auto" src={vector} alt="menu vector" />
                </button>
              </If>
            </div>
            {isAllowedToUpdate ? (
              <div className="mt-6 flex w-full space-x-6">
                <div className="flex w-full items-center">
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

                  {selectedMember != '' && (
                    <button
                      className="cursor-pointer ml-2"
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
            ) : (
              <div className="mt-6 flex w-full justify-between space-x-6">
                <div className="flex w-full">
                  <div className="flex flex-auto items-center space-x-2">
                    <UserImage
                      organizationId={organizationId}
                      selectedMember={selectedMember}
                    />
                    <div className="flex-1 min-w-0 text-xs w-[10px]">
                      <p className="truncate">
                        {' '}
                        {selectedMemberData?.fullName
                          ? selectedMemberData?.fullName
                          : 'Not assigned'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full cursor-pointer flex justify-end">
                  <div
                    className={`space-x-2 flex border px-2 py-2 rounded-md w-max ${
                      isDatePast ? 'bg-red-100' : ''
                    }`}
                  >
                    <Image src={calendar} alt="calendar"></Image>
                    <p className="my-auto text-xs font-normal">
                      {formatDate(selectedDate)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {showMenu && (
              <div
                ref={cardRef}
                className="absolute space-y-2 rounded-md py-1.5 px-2 top-10 right-8 z-50 bg-white border shadow-md"
              >
                <If condition={isAllowedToUpdate}>
                  <button className="flex space-x-2" onClick={toggleEditMode}>
                    <Image src={edit} alt="edit"></Image>
                    <p className="text-sm">Edit</p>
                  </button>
                </If>
                <If condition={isAllowedToDelete}>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex space-x-2"
                  >
                    <Image src={trash} alt="delete"></Image>
                    <p className="text-sm">Delete</p>
                  </button>
                </If>
              </div>
            )}
          </div>
          <If condition={isAllowedToUpdate || isAllowedToDelete}>
            <button
              onClick={() => {
                if (showOrgActions) {
                  ArchiveAction(false);
                } else {
                  ArchiveBoardAction(false);
                }
              }}
              className="flex items-center space-x-2 py-1.5 px-2 border shadow-md rounded-md mt-2.5 ml-auto"
            >
              <Image src={archiveRestore} alt="archiveRestore"></Image>
              <p>Restore</p>
            </button>
          </If>
        </>
      ) : (
        <LoadingBar />
      )}
      {showDeleteModal && (
        <DeleteModal
          message="Are you sure you want to delete this action Item?"
          showModal={showDeleteModal}
          setShowModal={setShowDeleteModal}
          confirmAction={showOrgActions ? DeleteAction : DeleteBoardAction}
        />
      )}
    </>
  );
});
