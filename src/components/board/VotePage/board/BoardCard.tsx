import { useState, useEffect, useRef } from 'react';
import toaster from 'react-hot-toast';
import vector from 'public/assets/svg/3-dots.svg';
import archive from 'public/assets/svg/archive.svg';
import trash from 'public/assets/svg/trash.svg';
import edit from 'public/assets/svg/edit-3.svg';

import { Task, Id } from '~/lib/actions/types/actions';

import Image from 'next/image';

import OrganizationAsigneeSelector from '~/components/actions/OrganizationAsigneeSelector';
import CustomDatePicker from '~/components/shared/datepicker';

import useUpdateActions from '~/lib/actions/hooks/update-actions';
import useDeleteActions from '~/lib/actions/hooks/delete-actions';
import useArchiveActions from '~/lib/actions/hooks/use-archive-actions';

import { XCircleIcon } from '@heroicons/react/24/outline';
import DeleteModal from '~/components/shared/deleteModal';
import { showDatePickerValue } from '~/components/utils/dateformatter';
import { useAuth } from 'reactfire';

interface Props {
  action: Task;
  organizationId: string;
  teamId: string;
  deleteTask: (id: Id) => void;
  updateTask: (id: string, content: Task) => void;
  archiveTask: (id: string, archive: boolean) => void;
}

function BoardCard({
  action,
  deleteTask,
  updateTask,
  organizationId,
  teamId,
  archiveTask,
}: Props) {
  const [task, setTask] = useState<Task | undefined>();

  const auth = useAuth();
  const currentUser = auth.currentUser?.uid as string;

  let date = undefined;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const prevSelectedDateRef = useRef<Date | undefined>(date);

  const [description, setDescription] = useState('');

  const [selectedMember, setSelectedMember] = useState('');
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

  const cardRef = useRef<HTMLDivElement>(null);

  const showDeleteModalHandler = () => {
    setShowDeleteModal(true);
  };

  const closeDeleteModalHandler = () => {
    setShowDeleteModal(false);
  };

  const UpdateAction = (archive: boolean) => {
    const body = {
      id: action.id,
      description: description,
      assignee: selectedMember,
      organization: organizationId,
      date: selectedDate ? selectedDate : '',
      status: action.status,
      archive: archive,
      order: action.order,
      facilitator: currentUser
    };

    updateActions(body)
      .then((res: any) => {
        updateTask(action.id, res.data);
      })
      .catch((e) => {
        console.log('ERROR updateActions', e);
      });
  };

  const ArchiveAction = async (archive: boolean) => {
    const body = {
      id: task?.id,
      archive: archive,
      organization: organizationId,
    };

    const promise = archiveActions(body)
      .then((res: any) => {
        archiveTask(action?.id, true);
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

  const DeleteAction = () => {
    const body = {
      id: task?.id,
      organization: organizationId,
    };
    DeleteActions(body)
      .then(() => {
        if (task?.id !== undefined) {
          deleteTask(task.id);
          closeDeleteModalHandler();
        }
      })
      .catch((e) => {
        console.log('ERROR deleteActions', e);
      });
  };

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

  useEffect(() => {
    if (action) {
      setTask(action);
    }
  }, [action]);

  useEffect(() => {
    if (task) {
      setDescription(task.description);
      setSelectedMember(task.assignee);

      date = showDatePickerValue(task.date);

      setSelectedDate(date);

      prevSelectedDateRef.current = date;
      prevSelectedMemberRef.current = task.assignee;
    }
  }, [task]);

  useEffect(() => {
    if (
      task &&
      (selectedDate !== prevSelectedDateRef.current ||
        selectedMember !== prevSelectedMemberRef.current)
    ) {
      UpdateAction(true);
      prevSelectedDateRef.current = selectedDate;
      prevSelectedMemberRef.current = selectedMember;
    }
  }, [selectedDate, selectedMember]);

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
    setShowMenu((prev) => !prev);
  };

  if (editMode) {
    return (
      <>
        <div className="">
          <div className="relative">
            <div
              className=" bg-white p-6 border rounded-md shadow-sm"
              onDoubleClick={() => setEditMode(false)}
            >
              <div className="flex justify-between w-full">
                <textarea
                  className="h-[90%] w-full resize-none border py-2 px-3 rounded focus:outline-none"
                  value={description}
                  placeholder="Enter your action description"
                  onBlur={() => {
                    UpdateAction(false);
                    setEditMode(false);
                    setShowMenu(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      UpdateAction(false);
                      setEditMode(false);
                      setShowMenu(false);
                    }
                  }}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <button
                  className="flex  h-6 w-6"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <Image className="ml-auto" src={vector} alt="menu vector" />
                </button>
              </div>
              <div className="mt-6 xl:flex w-full space-x-2">
                <div className="flex w-full">
                  <OrganizationAsigneeSelector
                    selectedMember={selectedMember}
                    setSelectedMember={setSelectedMember}
                    organizationId={organizationId}
                  />
                  {selectedMember != '' && (
                    <button
                      className="text-[#71717A] cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMember('');
                      }}
                    >
                      <XCircleIcon className="text-black h-5 w-5" />
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
            </div>
            {showMenu && (
              <div className="absolute space-y-2 rounded-md py-1.5 px-2 top-10 right-10 z-50 bg-white border shadow-md">
                <button className="flex space-x-2" onClick={toggleEditMode}>
                  <Image src={edit} alt="edit"></Image>
                  <p className="text-sm">Edit</p>
                </button>
                <button onClick={DeleteAction} className="flex space-x-2">
                  <Image src={trash} alt="delete"></Image>
                  <p className="text-sm">Delete</p>
                </button>
                <button
                  onClick={() => {
                    ArchiveAction(true);
                  }}
                  className="flex space-x-2"
                >
                  <Image src={archive} alt="archive"></Image>
                  <p className="text-sm">Archive</p>
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="">
      <div className="relative">
        <div className="bg-white p-6 border rounded-md shadow-sm">
          <div className="flex justify-between w-full">
            <p
              onDoubleClick={() => setEditMode(true)}
              className="overflow-hidden flex-grow flex-shrink min-w-0 max-w-[275px] my-auto w-full cursor-pointer overflow-hidden"
              style={
                showFullText
                  ? {
                      display: '-webkit-box',
                      WebkitLineClamp: 'unset',
                      WebkitBoxOrient: 'vertical',
                      overflowWrap: 'anywhere',
                      maxHeight: '200px',
                    }
                  : {
                      textOverflow: 'ellipsis',
                      WebkitLineClamp: 2,
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      overflowWrap: 'anywhere',
                    }
              }
              onClick={handleClick}
            >
              {description}
            </p>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex justify-end items-center w-8 h-6"
            >
              <Image src={vector} alt="vector" />
            </button>
          </div>
          <div className="mt-6 xl:flex w-full space-x-6">
            <div className="w-full flex">
              <OrganizationAsigneeSelector
                selectedMember={selectedMember}
                setSelectedMember={setSelectedMember}
                organizationId={organizationId}
              />
              {selectedMember != '' && (
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
            <div className="w-full cursor-pointer xl:flex xl:justify-end">
              <CustomDatePicker
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            </div>
          </div>
        </div>
        {showMenu && (
          <div
            ref={cardRef}
            className="absolute space-y-2 rounded-md py-1.5 px-2 top-10 right-10 z-50 bg-white border shadow-md"
          >
            <button className="flex space-x-2" onClick={toggleEditMode}>
              <Image src={edit} alt="edit"></Image>
              <p className="text-sm">Edit</p>
            </button>
            <button onClick={showDeleteModalHandler} className="flex space-x-2">
              <Image src={trash} alt="delete"></Image>
              <p className="text-sm">Delete</p>
            </button>
            <button
              className="flex space-x-2"
              onClick={() => {
                ArchiveAction(true);
              }}
            >
              <Image src={archive} alt="archive"></Image>
              <p className="text-sm">Archive</p>
            </button>
          </div>
        )}
      </div>
      <DeleteModal
        message="Are you sure you want to delete this action Item?"
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        confirmAction={DeleteAction}
      />
    </div>
  );
}

export default BoardCard;
