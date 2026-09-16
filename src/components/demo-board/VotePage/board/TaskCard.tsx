import { useState, useEffect, useRef } from 'react';

import vector from 'public/assets/svg/3-dots.svg';
import minus from 'public/assets/svg/minus-orange.svg';
import plus from 'public/assets/svg/plus-white.svg';
import edit from 'public/assets/svg/edit-3.svg';
import x from '/public/assets/svg/x.svg';
import close from 'public/assets/svg/close.svg';
import trash from 'public/assets/svg/trash.svg';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import Image from 'next/image';

import { XCircleIcon } from '@heroicons/react/24/outline';

import CustomTextArea from '~/components/shared/textArea';
import BoardAsigneeSelector from '../../BoardAssigneeSelector';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import ContextMenu from '~/components/shared/contextMenu';
import { Comment } from '~/lib/board/types/types';
import toaster from 'react-hot-toast';

import Paragraph from '~/components/shared/paragraph';
import If from '~/core/ui/If';

import DeleteModal from '~/components/shared/deleteModal';

import useUpdateDemoComments from '~/lib/demo/hooks/use-update-demo-comment';
import useDeleteDemoComments from '~/lib/demo/hooks/use-delete-demo-comments';
import { Avatar, AvatarFallback } from '~/core/ui/Avatar';

interface Props {
  comment: Comment;
  updateTask: any;
  showAuthors: boolean;
  active?: boolean;
  numberVotes: number;
  voteNumber: number;
  allowed: boolean;
  editCard: string;
  setEditCard: (card: any) => void;
  deleteTask: (id: string) => void;
  isDoneVoting: boolean;
  loadingVotes: any;
  isSuperAdmin: boolean;
  totalVotes: number;
  retrospective: Retrospectives
}

function TaskCard({
  comment,
  updateTask,
  showAuthors,
  active,
  numberVotes,
  voteNumber,
  allowed,
  editCard,
  setEditCard,
  deleteTask,
  isDoneVoting,
  loadingVotes,
  isSuperAdmin,
  totalVotes,
  retrospective
}: Props) {
  const [task, setTask] = useState<Comment | undefined>();
  
  const [votingCard, setVotingCard] = useState(0);

  const [description, setDescription] = useState('');

  const [selectedMember, setSelectedMember] = useState('');
  const prevSelectedMemberRef = useRef<string | undefined>(undefined);
  const ref = useRef<HTMLDivElement>(null);

  const { trigger: UpdateComments } = useUpdateDemoComments();

  const [editMode, setEditMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isAllowedToUpdate = isSuperAdmin;
  const isAllowedToDelete = isSuperAdmin;
  
  const { trigger: DeleteComment } = useDeleteDemoComments(comment.id);

  const [hasDone, setHasDone] = useState(false);

  const showDeleteModalHandler = () => {
    setShowDeleteModal(true);
  };

  const closeDeleteModalHandler = () => {
    setShowDeleteModal(false);
  };

  const UpdateComment = async (type: string, votes: number) => {
    const body = {
      id: comment.id,
      description: description,
      assignee: selectedMember,
      order: comment.order,
      group: comment.group,
      votes: votes,
      voter: comment.voters,
      status: comment.status,
    };

    const promise = UpdateComments(body)
      .then((res: any) => {
        setShowMenu(false);
        if (res.success) {
          updateTask(comment.id, res.data);
          setEditMode(false);
          setEditCard('');
        }
      })
      .catch((e) => {
        console.log('ERROR UpdateComments', e);
      });
    if (type === 'member') {
      await toaster.promise(promise, {
        loading: 'Updating Assignee',
        success: 'Assignee Updated',
        error: 'Error updating assignee',
      });
    } else {
      await toaster.promise(promise, {
        loading: 'Updating comment',
        success: 'Comment has been updated',
        error: 'Error updating comment',
      });
    }
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
        console.log('ERROR deleteComment', e);
      });
    await toaster.promise(promise, {
      loading: 'Deleting comment',
      success: 'Comment has been deleted',
      error: 'Error deleting comment',
    });
  };

  useEffect(() => {
    if (comment) {
      setTask(comment);
      setVotingCard(comment.votes);
    }
  }, [comment]);

  useEffect(() => {
    if (task) {
      setDescription(task.description);
      setSelectedMember(task.assignee);
      prevSelectedMemberRef.current = task.assignee;
    }
  }, [task]);

  useEffect(() => {
    if (editCard !== comment.id) {
      if (task && selectedMember !== prevSelectedMemberRef.current) {
        UpdateComment('member', comment.votes);
        prevSelectedMemberRef.current = selectedMember;
      }
    }
  }, [selectedMember]);

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

  const toggleEditMode = () => {
    if (isAllowedToUpdate) {
      setEditCard((prevEditCard: any) =>
        prevEditCard === comment.id ? '' : comment.id,
      );
      setEditMode(!editMode);
      setShowMenu((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsFocused(false);
        setShowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const menuOptions = [];
  if (isAllowedToUpdate) {
    menuOptions.unshift({
      name: 'Edit',
      action: toggleEditMode,
      icon: edit,
    });
  }
  if (isAllowedToDelete) {
    menuOptions.unshift({
      name: 'Delete',
      action: showDeleteModalHandler,
      icon: trash,
    });
  }

  function incrementVote() {
    const hasValidVotes = numberVotes && voteNumber !== undefined;
    const canIncrement = totalVotes < numberVotes;

    if (hasValidVotes && canIncrement) {
      const totalVotes = comment.votes + 1;
      comment.votes = totalVotes;
      UpdateComment('', totalVotes);
    }
  }

  function decrementVote() {
    const hasValidVotes = numberVotes && voteNumber !== undefined;
    const canDecrement = votingCard > 0;

    if (hasValidVotes && canDecrement) {
      const totalVotes = comment.votes - 1;
      comment.votes = totalVotes;
      UpdateComment('', totalVotes);
    }
  }

  const onDoubleClickEvent = () => {
    if (isAllowedToUpdate) {
      setEditCard(comment.id);
      setEditMode(true);
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className=""
      >
        <div className="relative cursor-grab opacity-50">
          <div className=" bg-white p-6 border rounded-md shadow-sm">
            <div className="flex justify-between w-full">
              <p
                className="text-[#71717A] overflow-hidden flex-grow flex-shrink my-auto w-full cursor-pointer overflow-hidden"
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
            </div>
            <div className="mt-6 flex w-full">
              <div className="w-full">
                <BoardAsigneeSelector
                  selectedMember={selectedMember}
                  setSelectedMember={setSelectedMember}
                  className={'max-w-[250px] overflow-hidden text-left'}
                  members={retrospective?.members}
                />
              </div>
              <div className="w-full cursor-pointer flex justify-end">
                <button
                  className="flex  w-h w-6"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <Image className="ml-auto" src={vector} alt="menu vector" />
                </button>
              </div>
            </div>
          </div>
          {showMenu && (
            <div className="absolute space-y-2 rounded-md py-1.5 px-2 top-10 right-10 z-50 bg-white border shadow-md">
              <button className="flex space-x-2" onClick={toggleEditMode}>
                <Image src={edit} alt="edit"></Image>
                <p className="text-sm">Edit</p>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (editCard === comment.id) {
    return (
      <>
        <div className="">
          <div className="relative">
            <div
              ref={ref}
              className={`bg-white border rounded-md shadow-sm ${
                (isFocused || active) && 'border-orange-500'
              }`}
              onClick={() => setIsFocused(true)}
              onDoubleClick={() => {
                setEditCard('');
                setEditMode(false);
                setShowMenu(false);
              }}
            >
              <div className="flex w-full justify-end">
                <button
                  className="h-8 w-8 mt-2"
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
              </div>
              <div className="p-5">
                <div
                  onFocus={() => setShowMenu(false)}
                  className="flex justify-between w-full"
                >
                  <CustomTextArea
                    description={description}
                    setDescription={setDescription}
                    enter={() => {}}
                    placeholder="Enter your comment description"
                  />
                </div>
                <div className="mt-6 flex w-full space-x-2">
                  {showAuthors && (
                    <div className="flex justify-between w-full">
                      {isAllowedToUpdate ? (
                        <BoardAsigneeSelector
                          selectedMember={selectedMember}
                          setSelectedMember={setSelectedMember}
                          className={'max-w-[250px] overflow-hidden text-left'}
                          members={retrospective?.members}
                        />
                      ) : (
                        <div className="flex flex-auto items-center space-x-4">
                          <Avatar>
                          <AvatarFallback>
                            {selectedMember.trim().charAt(0).toUpperCase()}
                          </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 text-xs">
                            <p className="truncate">
                              {comment.assignee !== ''
                                ? comment.assignee
                                : 'Anonymous'}
                            </p>
                          </div>
                        </div>
                      )}
                      <If condition={selectedMember !== ''}>
                        <div className="w-full cursor-pointer items-center flex justify-end">
                          <button
                            className="border rounded-md h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMember('');
                            }}
                          >
                            <Image
                              className="m-auto"
                              src={close}
                              alt="close"
                            ></Image>
                          </button>
                        </div>
                      </If>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    UpdateComment('', comment.votes);
                  }}
                  className="flex items-center justify-center space-x-2 mt-5 bg-[#F4F4F5] rounded-md hover:bg-gray-50 px-4 py-2 w-full text-sm font-medium"
                >
                  <Image src={edit} alt="update"></Image>
                  <p>Update</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      onClick={() => setIsFocused(true)}
      ref={allowed ? setNodeRef : null}
      style={allowed ? style : undefined}
      {...(allowed ? { ...attributes } : {})}
      {...(allowed ? { ...listeners } : {})}
      className=""
    >
      <div
        ref={ref}
        onClick={() => setIsFocused(true)}
        className={`${allowed && 'cursor-grab'} 'relative w-full text-left`}
      >
        <div
          className={`bg-white ${
            (isFocused || active) && 'border-orange-500'
          }   hover:bg-zinc-50 p-5 border rounded-md shadow-sm`}
        >
          <div className="flex justify-between w-full space-x-2">
            {'user1@retroteam.ai' === comment.author && (
              <div className="w-[2px] h-[34px] bg-orange-300"></div>
            )}
            <Paragraph
              description={description}
              onDoubleClickEvent={onDoubleClickEvent}
            />
            {(isAllowedToDelete || isAllowedToUpdate) && (
              <ContextMenu
                mainClassName={'relative ml-1'}
                className={
                  'absolute w-max space-y-2 rounded-md py-1.5 px-2 right-0 top-5 z-50 bg-white border shadow-md text-black'
                }
                options={menuOptions}
              />
            )}
          </div>
          <div
            className={`mt-6 flex w-full ${
              showAuthors ? 'justify-between' : 'justify-end'
            } space-x-6 items-center`}
          >
            <If condition={showAuthors}>
              <div className="flex">
                {isAllowedToUpdate ? (
                  <>
                    {' '}
                    <BoardAsigneeSelector
                      selectedMember={selectedMember}
                      setSelectedMember={setSelectedMember}
                      className={'max-w-[250px] overflow-hidden text-left'}
                      members={retrospective?.members}
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
                  </>
                ) : (
                  <div
                    className="flex flex-auto items-center space-x-4"
                    onClick={() => {
                      setIsFocused(true);
                    }}
                  >
                    <Avatar>
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="truncate">
                        {comment.assignee !== ''
                          ? comment.assignee
                          : 'Anonymous'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </If>

            <div className="flex space-x-2">
              <button
                disabled={!isSuperAdmin || loadingVotes || hasDone}
                onClick={decrementVote}
                className="w-[25px] h-[25px] disabled:bg-gray-50 disabled:border-orange-300  my-auto  border border-orange-500 hover:border-orange-400 rounded-full"
              >
                <Image className="m-auto" alt="minus" src={minus} />
              </button>
              <p className="font-medium text-xl m-auto">{votingCard}</p>
              <button
                disabled={
                  !isSuperAdmin || loadingVotes || isDoneVoting || hasDone
                }
                onClick={incrementVote}
                className="w-[25px] h-[25px]  my-auto disabled:bg-orange-300 bg-orange-500 hover:bg-orange-400 rounded-full"
              >
                <Image className="m-auto" alt="plus" src={plus} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <DeleteModal
        title="Delete comment?"
        message="Are you sure you want to delete this comment?"
        confirmMessage="Delete"
        cancelMessage="Cancel"
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        confirmAction={DeleteComments}
        cancelAction={() => {
          setShowDeleteModal(false);
        }}
      />
    </div>
  );
}

export default TaskCard;
