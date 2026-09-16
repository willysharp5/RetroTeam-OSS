import { useState, useEffect, useRef } from 'react';
import toaster from 'react-hot-toast';
import vector from 'public/assets/svg/3-dots.svg';
import trash from 'public/assets/svg/trash.svg';
import edit from 'public/assets/svg/edit-3.svg';
import update from 'public/assets/svg/update.svg';

import { Task, Id } from '~/lib/actions/types/actions';

import Image from 'next/image';

import { XCircleIcon } from '@heroicons/react/24/outline';
import CustomTextArea from '~/components/shared/textArea';
import useUpdateComments from '~/lib/board/hooks/use-update-comments';
import useDeleteComments from '~/lib/board/hooks/use-delete-comment';
import CancelContinueModal from '~/components/shared/cancelContinueModal';
import { TeamMembers } from '~/lib/teams/types/teams';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import { useAuth } from 'reactfire';
import BoardAsigneeSelector from '../../BoardAssigneeSelector';
import UserImage from '~/components/dashboard/UserImage';
import { showDatePickerValue } from '~/components/utils/dateformatter';

interface Props {
  comment: Task;
  organizationId: string;
  teamId: string;
  retrospectiveId: string;
  retrospective: Retrospectives;
  deleteTask: (id: Id) => void;
  updateTask: (id: string, content: Task) => void;
  teamMembers: TeamMembers[];
}

function BoardCard({
  comment,
  deleteTask,
  updateTask,
  organizationId,
  teamId,
  retrospectiveId,
  retrospective,
}: Props) {
  const [task, setTask] = useState<Task | undefined>();

  let date = undefined;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const prevSelectedDateRef = useRef<Date | undefined>(date);

  const [description, setDescription] = useState('');

  const [selectedMember, setSelectedMember] = useState('');
  const prevSelectedMemberRef = useRef<string | undefined>(undefined);

  const auth = useAuth();
  const currentUser = auth?.currentUser?.uid as string;

  const [name, setName] = useState("Anonymous")
  if(currentUser === comment.author){
    const name = comment.user.name + ' ' + comment.user.lastName
    setName(name)
  }
 

  const { trigger: updateComment } = useUpdateComments();
  const { trigger: DeleteComment } = useDeleteComments(
    organizationId,
    retrospectiveId,
    comment.id,
  );

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

    const dashboardElement = document.getElementById('actions');
    if (dashboardElement) {
      dashboardElement.setAttribute('class', 'blur-[2px]');
    }
  };

  const closeDeleteModalHandler = () => {
    setShowDeleteModal(false);

    const dashboardElement = document.getElementById('actions');
    if (dashboardElement) {
      dashboardElement.removeAttribute('class');
    }
  };

  const UpdateComment = () => {
    const body = {
      id: comment.id,
      description: description,
      assignee: selectedMember,
      organization: organizationId,
      teamId,
      retrospectiveId,
      status: comment.status,
      order: comment.order,
    };
    updateComment(body)
      .then((res: any) => {
        updateTask(comment.id, res.data);
      })
      .catch((e: any) => {
        console.error('ERROR UpdateComments', e);
      });
  };

  const DeleteComments = async () => {
    const promise = DeleteComment()
      .then(() => {
        if (task?.id !== undefined) {
          deleteTask(task.id);
          closeDeleteModalHandler();
        }
      })
      .catch((e) => {
        console.error('ERROR deleteComment', e);
      });
    await toaster.promise(promise, {
      loading: 'Deleting comment',
      success: 'Comment has been deleted',
      error: 'Error deleting comment',
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
    if (comment) {
      setTask(comment);
    }
  }, [comment]);

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
      UpdateComment();
      prevSelectedDateRef.current = selectedDate;
      prevSelectedMemberRef.current = selectedMember;
    }
  }, [selectedDate, selectedMember]);

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
    setShowMenu((prev) => !prev);
  };

  const enterfunction = () => {
    UpdateComment();
    setEditMode(false);
    setShowMenu(false);
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
                <CustomTextArea
                  description={description}
                  setDescription={setDescription}
                  enter={enterfunction}
                  placeholder="Enter your comment description"
                />
                <button
                  className="flex  h-6 w-6"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <Image className="ml-auto" src={vector} alt="menu vector" />
                </button>
              </div>
              <div className="mt-6 xl:flex w-full space-x-2">
                <div className="mt-6 flex w-full space-x-2">
                  {retrospective.authors && (
                    <div className="flex w-full">
                      {comment.author === currentUser ? (
                        <BoardAsigneeSelector
                          selectedMember={selectedMember}
                          setSelectedMember={setSelectedMember}
                          className={'max-w-[250px] overflow-hidden text-left'}
                          members={retrospective?.members}
                        />
                      ) : (
                        <div className="flex flex-auto items-center space-x-4">
                          <UserImage
                            organizationId={organizationId}
                            selectedMember={comment.assignee}
                          />
                          <div className="flex-1 min-w-0 text-xs">
                            <p className="truncate">
                              {comment.user.name
                                ? comment.user.name
                                : 'Anonymous'}{' '}
                              {comment.user.lastName}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedMember != '' && (
                        <button
                          className="text-black cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMember('');
                          }}
                        >
                          <XCircleIcon className="text-black h-5 w-5" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="w-full cursor-pointer flex justify-end">
                    <button
                      className="flex  w-h w-6"
                      onClick={() => setShowMenu(!showMenu)}
                    >
                      <Image
                        className="ml-auto"
                        src={vector}
                        alt="menu vector"
                      />
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  UpdateComment();
                }}
                className="flex items-center justify-center space-x-2 mt-5 bg-[#F4F4F5] rounded-md hover:bg-gray-50 px-4 py-2 w-full text-sm font-medium"
              >
                <Image src={update} alt="update"></Image>
                <p>Update</p>
              </button>
            </div>
            {showMenu && (
              <div className="absolute space-y-2 rounded-md py-1.5 px-2 top-10 right-10 z-50 bg-white border shadow-md">
                <button className="flex space-x-2" onClick={toggleEditMode}>
                  <Image src={edit} alt="edit"></Image>
                  <p className="text-sm">Edit</p>
                </button>
                <button onClick={DeleteComment} className="flex space-x-2">
                  <Image src={trash} alt="delete"></Image>
                  <p className="text-sm">Delete</p>
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
              onDoubleClick={() => {
                if (comment.author === currentUser) setEditMode(true);
              }}
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
            {comment.author === currentUser && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex justify-end items-center w-8 h-6"
              >
                <Image src={vector} alt="vector" />
              </button>
            )}
          </div>
          <div className="mt-6 xl:flex w-full space-x-6">
            <div className="w-full flex">
              {retrospective.authors && (
                <div className="flex w-full">
                  {comment.author === currentUser ? (
                    <BoardAsigneeSelector
                      selectedMember={selectedMember}
                      setSelectedMember={setSelectedMember}
                      className={'max-w-[250px] overflow-hidden text-left'}
                      members={retrospective?.members}
                    />
                  ) : (
                    <div className="flex flex-auto items-center space-x-4">
                      <UserImage
                        organizationId={organizationId}
                        selectedMember={comment.assignee}
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="truncate">
                          {comment.user.name ? comment.user.name : 'Anonymous'}{' '}
                          {comment.user.lastName}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedMember != '' && comment.author === currentUser && (
                    <button
                      className="text-black cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMember('');
                      }}
                    >
                      <XCircleIcon className="text-black h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
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
          </div>
        )}
      </div>
      <CancelContinueModal
        title="Delete"
        message="Are you sure you want to delete this comment"
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        confirmAction={DeleteComments}
      />
    </div>
  );
}

export default BoardCard;
