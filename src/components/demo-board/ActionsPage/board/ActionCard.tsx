import { useState, useEffect, useRef } from 'react';
import toaster from 'react-hot-toast';

import { Task } from '~/lib/actions/types/actions';
import vector from 'public/assets/svg/3-dots.svg';
import DeleteModal from '~/components/shared/deleteModal';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';

import CustomDatePicker from '~/components/shared/datepicker';

import { showDatePickerValue } from '~/components/utils/dateformatter';

import BoardAsigneeSelector from '../../BoardAssigneeSelector';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';

import { TooltipContent, Tooltip, TooltipTrigger } from '~/core/ui/Tooltip';
import edit from '/public/assets/svg/edit-3.svg';
import trash from '/public/assets/svg/trash.svg';
import archive from '/public/assets/svg/archive.svg';
import calendar from '/public/assets/svg/calendar.svg';

import { XCircleIcon } from '@heroicons/react/24/outline';
import { TeamMembers } from '~/lib/teams/types/teams';

import If from '~/core/ui/If';
import Paragraph from '~/components/shared/paragraph';
import { Avatar, AvatarFallback } from '~/core/ui/Avatar';

import x from '/public/assets/svg/x.svg';
import update from '/public/assets/svg/update.svg';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/Select';
import CustomTextArea from '~/components/shared/textArea';
import useUpdateDemoActions from '~/lib/demo/hooks/use-update-demo-action';
import useDeleteDemoAction from '~/lib/demo/hooks/use-delete-demo-action';
import useArchiveDemoActions from '~/lib/demo/hooks/use-archive-demo-actions';

interface ActionCardProps {
  action: Task;
  deleteTask: (id: string) => void;
  updateTask: (id: string, content: Task) => void;
  archiveTask: (id: string, archive: boolean) => void;
  index: any;
  retrospective: Retrospectives;
  active: boolean;
  isSuperAdmin: boolean;
  editCard: any;
  setEditCard: (card: any) => void;
}

function ActionCard({
  action,
  deleteTask,
  updateTask,
  archiveTask,
  index,
  active,
  isSuperAdmin,
  editCard,
  setEditCard,
  retrospective,
}: ActionCardProps) {
  const [task, setTask] = useState<Task | undefined>();

  let date = undefined;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const [description, setDescription] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  const [status, setStatus] = useState('');

  const { trigger: updateActions } = useUpdateDemoActions();
  const { trigger: archiveActions } = useArchiveDemoActions();
  const { trigger: deleteActions } = useDeleteDemoAction(action.id);

  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const isAllowedToGrab = isSuperAdmin;

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
      date: selectedDate ? selectedDate : '',
      order: action.order,
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
      date: type === 'date' ? value : action.date,
      order: action.order,
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
                <BoardAsigneeSelector
                  selectedMember={selectedMember}
                  setSelectedMember={setSelectedMember}
                  className={'max-w-[250px] overflow-hidden text-left'}
                  members={retrospective?.members}
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
          selectedMember={selectedMember}
          setSelectedMember={setSelectedMember}
          index={index}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          setShowDeleteModal={setShowDeleteModal}
          UpdateAction={UpdateAction}
          isBoard={true}
          setEditCard={setEditCard}
          retrospective={retrospective}
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
        selectedMember={selectedMember}
        setSelectedMember={(newAssignee) => {
          setSelectedMember(() => {
            UpdateActionHandler('member', newAssignee);
            return newAssignee;
          });
        }}
        action={action}
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
        isAllowedToUpdate={isSuperAdmin}
        editCard={editCard}
        setEditCard={setEditCard}
        id={action.id}
        ArchiveAction={setShowArchiveModal}
        isArchive={action.archive}
        retrospective={retrospective}
        isSuperAdmin={isSuperAdmin}
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

interface CardProps {
  setEditMode: (editMode: any) => void;
  description: string;
  selectedMember: string;
  setSelectedMember: (member: string) => void;
  selectedDate: any;
  setSelectedDate: any;
  setShowDeleteModal: any;
  ArchiveAction: any;
  active: boolean;
  author: string;
  isBoard?: boolean;
  isAllowedToUpdate?: boolean;
  setEditCard: (card: any) => void;
  editCard: any;
  id: string;
  width?: string;
  isArchive: boolean;
  isSuperAdmin: boolean;
  action: Task;
  retrospective: Retrospectives
}

function Card({
  setEditMode,
  description,
  selectedMember,
  setSelectedMember,
  selectedDate,
  setSelectedDate,
  setShowDeleteModal,
  ArchiveAction,
  active,
  author,
  isBoard = false,
  isAllowedToUpdate = true,
  setEditCard,
  id,
  width,
  isArchive = false,
  isSuperAdmin,
  action,
  retrospective
}: CardProps) {
  const currentUser = 'user1@retroteam.ai';
  const cardRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  const [showMenu, setShowMenu] = useState(false);

  const [isFocused, setIsFocused] = useState(false);

  const isAllowedToUpdateCards = isSuperAdmin;
  const isAllowedToDeleteCards = isSuperAdmin;

  const handleClickOutside = (event: any) => {
    if (cardRef.current && !cardRef.current.contains(event.target)) {
      setShowMenu(false);
    }
  };

  const showDeleteModalHandler = () => {
    setShowDeleteModal(true);
  };
  const [isDatePast, setIsDatePast] = useState(false);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isAllowedToUpdate) {
      const today = new Date();
      const isDatePast = selectedDate < today;
      setIsDatePast(isDatePast);
    }
  }, [isAllowedToUpdate, selectedMember, selectedDate]);

  const formatDate = (date: Date | undefined) => {
    if (!date) {
      return 'No due date';
    }
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  };

  const onDoubleClickEvent = () => {
    if (isAllowedToUpdateCards) {
      setEditCard(id);
      setEditMode(true);
    }
  };

  const ProfileAvatar: React.FC<{ selectedMember: string }> = ({
    selectedMember,
  }) => {
    return selectedMember !== '' ? (
      <Avatar>
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    ) : (
      <div>
        <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-gray-300 font-semibold uppercase text-white"></span>
        </span>
      </div>
    );
  };

  return (
    <Tooltip className="relative my-6">
      <TooltipTrigger
        asChild
        className={`bg-white hover:bg-zinc-50 p-5 border rounded-md  shadow-sm  ${
          isFocused || active ? 'border-orange-500' : ''
        } ${
          isBoard
            ? 'bg-white hover:bg-zinc-50 p-5 border rounded-md shadow-sm md:w-full'
            : ''
        } ${width ? width : isBoard ? 'w-[350px]' : 'w-[350px] tv:w-[400px]'}`}
      >
        <div className="text-left" ref={ref} onClick={() => setIsFocused(true)}>
          <div
            className={`flex justify-between w-full ${
              author === currentUser && 'space-x-2'
            }`}
          >
            <If condition={author === currentUser}>
              <div className="w-[2px] h-[34px] bg-orange-300"></div>
            </If>
            <Paragraph
              description={description}
              onDoubleClickEvent={onDoubleClickEvent}
            />
            <If condition={isAllowedToUpdateCards || isAllowedToDeleteCards}>
              <div className="relative">
                <button
                  className="flex relative  w-h w-6"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <Image className="ml-auto" src={vector} alt="menu vector" />
                </button>

                {showMenu && (
                  <div
                    ref={cardRef}
                    className="absolute space-y-2 w-max rounded-md py-1.5 px-2 top-0 right-2 z-50 bg-white border shadow-md"
                  >
                    <If condition={isAllowedToUpdateCards}>
                      <button
                        className="flex space-x-2 w-full"
                        onClick={() => setEditCard(id)}
                      >
                        <Image src={edit} alt="edit"></Image>
                        <p className="text-sm">Edit</p>
                      </button>
                    </If>
                    <If condition={isAllowedToDeleteCards}>
                      <button
                        onClick={showDeleteModalHandler}
                        className="flex space-x-2"
                      >
                        <Image src={trash} alt="delete"></Image>
                        <p className="text-sm">Delete</p>
                      </button>
                    </If>
                    {!isArchive ? (
                      <button
                        className="flex space-x-2"
                        onClick={() => {
                          ArchiveAction(true);
                          setShowMenu(false);
                        }}
                      >
                        <Image src={archive} alt="archive"></Image>
                        <p className="text-sm">Archive</p>
                      </button>
                    ) : (
                      <button
                        className="flex space-x-2"
                        onClick={() => {
                          ArchiveAction(false);
                          setShowMenu(false);
                        }}
                      >
                        <Image src={archive} alt="archive"></Image>
                        <p className="text-sm">Restore</p>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </If>
          </div>
          {isAllowedToUpdate ? (
            <div className="mt-6 flex w-full justify-between space-x-6">
              <div className="flex w-full">
                <div className="">
                  <BoardAsigneeSelector
                    setSelectedMember={setSelectedMember}
                    selectedMember={selectedMember}
                    members={retrospective?.members}
                  />
                </div>
                <div className="my-auto">
                  {selectedMember !== '' && (
                    <button
                      className="ml-2 text-[#71717A] cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMember('');
                      }}
                    >
                      <XCircleIcon className="text-black h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="w-full cursor-pointer flex justify-end">
                <CustomDatePicker
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 flex w-full justify-between space-x-6">
              <div className="flex w-full">
                <div className="flex flex-auto items-center space-x-4">
                  <ProfileAvatar selectedMember={action.assignee} />
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="truncate">
                      {action.assignee !== '' ? action.assignee : 'Anonymous'}
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
        </div>
      </TooltipTrigger>
      <If condition={!active && isAllowedToUpdateCards}>
        <TooltipContent side="bottom">Double click to edit</TooltipContent>
      </If>
    </Tooltip>
  );
}

interface UpdateActionCardProps {
  status?: string;
  setStatus?: (status: string) => void;
  description: string;
  setDescription: (description: string) => void;
  selectedMember: string;
  setSelectedMember: (member: string) => void;
  index: any;
  selectedDate: any;
  setSelectedDate: any;
  setShowDeleteModal: any;
  UpdateAction: any;
  isBoard?: boolean;
  hasCloseButton?: boolean;
  setEditCard: (card: any) => void;
  width?: string;
  retrospective: Retrospectives
}

function UpdateActionCard({
  status,
  setStatus,
  description,
  setDescription,
  selectedMember,
  setSelectedMember,
  selectedDate,
  setSelectedDate,
  UpdateAction,
  isBoard = false,
  hasCloseButton = true,
  setEditCard,
  width,
  retrospective
}: UpdateActionCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [isFocused, setIsFocused] = useState(true);

  return (
    <div className="relative">
      <div
        ref={ref}
        className={`bg-white hover:bg-zinc-50 p-5 border rounded-md mx-6 md:mx-0 shadow-sm  ${
          isFocused && 'border-orange-500'
        } ${
          isBoard
            ? 'bg-white hover:bg-zinc-50 p-5 border rounded-md shadow-sm w-[350px] md:w-full'
            : width
            ? width
            : 'w-[350px] tv:w-[400px]'
        }`}
        onClick={() => setIsFocused(true)}
        onDoubleClick={() => setEditCard('')}
      >
        <div className="w-full flex justify-between items-center">
          <div className="w-1/2">
            <Select
              value={status}
              onValueChange={(value) => {
                if (setStatus) setStatus(value);
              }}
            >
              <SelectTrigger data-cy={'role-selector-trigger'}>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem
                  key={'To Do'}
                  data-cy={'filter-status'}
                  value={'To do'}
                >
                  <p>To Do</p>
                </SelectItem>
                <SelectItem
                  key={'In Progress'}
                  data-cy={'filter-status'}
                  value={'In Progress'}
                >
                  <p>In Progress</p>
                </SelectItem>
                <SelectItem
                  key={'Done'}
                  data-cy={'filter-status'}
                  value={'Done'}
                >
                  <p>Done</p>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <If condition={hasCloseButton}>
            <button
              className="h-8 w-8 "
              onClick={(e) => {
                e.stopPropagation();
                setEditCard('');
              }}
            >
              <Image
                className="m-auto"
                width={20}
                height={20}
                src={x}
                alt="close"
              ></Image>
            </button>
          </If>
        </div>
        <div className="mt-2 flex justify-between w-full">
          <CustomTextArea
            description={description}
            setDescription={setDescription}
            enter={() => {}}
            placeholder="Enter your action description"
          />
        </div>
        <div className="mt-6 flex w-full space-x-2 justify-between">
          <div className="flex">
            <BoardAsigneeSelector
              selectedMember={selectedMember}
              setSelectedMember={setSelectedMember}
              className={'max-w-[250px] overflow-hidden text-left'}
              members={retrospective?.members}
            />
            {selectedMember != '' && (
              <button
                className="text-black ml-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMember('');
                }}
              >
                <XCircleIcon className="text-black h-5 w-5" />
              </button>
            )}
          </div>
          <div className="cursor-pointer xl:flex xl:justify-end">
            <CustomDatePicker
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </div>
        </div>
        <button
          onClick={() => {
            UpdateAction(false);
          }}
          className="flex items-center justify-center space-x-2 mt-5 bg-[#F4F4F5] rounded-md hover:bg-gray-50 px-4 py-2 w-full text-sm font-medium"
        >
          <Image src={update} alt="plusSquare"></Image>
          <p>Update</p>
        </button>
      </div>
    </div>
  );
}

export default ActionCard;
