import { useState, useEffect, useRef } from 'react';
import toaster from 'react-hot-toast';
import vector from 'public/assets/svg/3-dots.svg';
import trash from 'public/assets/svg/trash.svg';
import edit from 'public/assets/svg/edit-3.svg';
import update from 'public/assets/svg/update.svg';
import minus from 'public/assets/svg/minus-orange.svg';
import plus from 'public/assets/svg/plus-white.svg';
import x from '/public/assets/svg/x.svg';
import close from 'public/assets/svg/close.svg';

import { Id } from '~/lib/actions/types/actions';

import Image from 'next/image';

import { XCircleIcon } from '@heroicons/react/24/outline';
import CustomTextArea from '~/components/shared/textArea';

import BoardAsigneeSelector from '../../BoardAssigneeSelector';
import { Comment } from '~/lib/board/types/types';


import Paragraph from '~/components/shared/paragraph';
import If from '~/core/ui/If';
import DeleteModal from '~/components/shared/deleteModal';

import useUpdateDemoComments from '~/lib/demo/hooks/use-update-demo-comment';
import useDeleteDemoComments from '~/lib/demo/hooks/use-delete-demo-comments';
import { Avatar, AvatarFallback } from '~/core/ui/Avatar';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';

interface Props {
  comment: Comment;
  deleteTask: (id: Id) => void;
  updateTask: (id: string, content: Comment) => void;
  numberVotes: number;
  isVoting: boolean;
  isAction: boolean;
  voteNumber: number;
  isSuperAmin: boolean;
  editCard: string;
  setEditCard: (edit: string) => void;
  isDoneVoting?: boolean;
  loadingVotes?: boolean;
  totalVotes: number;
  showAuthors: boolean;
  retrospective: Retrospectives
}

function BoardCard({
  comment,
  deleteTask,
  updateTask,
  numberVotes,
  isVoting,
  isAction,
  voteNumber,
  isSuperAmin,
  editCard,
  setEditCard,
  isDoneVoting,
  loadingVotes,
  totalVotes,
  showAuthors,
  retrospective
}: Props) {
  const [task, setTask] = useState<Comment | undefined>();
  const [votingCard, setVotingCard] = useState(0);

  const [description, setDescription] = useState('');

  const [selectedMember, setSelectedMember] = useState('');
  const prevSelectedMemberRef = useRef<string | undefined>(undefined);

  const { trigger: updateComment } = useUpdateDemoComments();
  const { trigger: DeleteComment } = useDeleteDemoComments(comment.id);

  useEffect(() => {
    if (comment) {
      setVotingCard(comment.votes);
      setSelectedMember(comment.assignee);
      prevSelectedMemberRef.current = comment.assignee;
    }
  }, [comment]);

  const isAllowedToUpdate = isSuperAmin;
  const isAllowedToDelete = isSuperAmin;
  const isAllowedToVote = isSuperAmin;

  const [hasDone, setHasDone] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const UpdateComment = async (type: string, votes: number) => {
    const body = {
      id: comment.id,
      description: description,
      assignee: selectedMember,
      status: comment.status,
      order: comment.order,
      votes: votes,
      voter: comment.voters,
      group: comment.group,
    };
    const promise = updateComment(body)
      .then((res: any) => {
        if (res.success) {
          updateTask(comment.id, res.data);
          setEditMode(false);
          setEditCard('');
          setShowMenu(false);
        }
      })
      .catch((e: any) => {
        console.error('ERROR UpdateComments', e);
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
    if (editCard !== comment.id) {
      if (task && selectedMember !== prevSelectedMemberRef.current) {
        UpdateComment('member', comment.votes);
        prevSelectedMemberRef.current = selectedMember;
      }
    }
  }, [selectedMember]);

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

  useEffect(() => {
    if (comment) {
      setDescription(comment.description);
    }
  }, [comment]);

  if (editCard === comment.id) {
    return (
      <>
        <div className="">
          <div className="relative">
            <div
              className=" bg-white border rounded-md shadow-sm"
              onDoubleClick={() => setEditMode(false)}
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

              <div className="p-6">
                <div
                  onDoubleClick={() => setEditCard('')}
                  className="flex justify-between w-full"
                >
                  <CustomTextArea
                    description={description}
                    setDescription={setDescription}
                    enter={() => {}}
                    placeholder="Enter your comment description"
                  />
                </div>
                <div className="mt-6 xl:flex w-full space-x-2">
                  <div className="mt-6 flex w-full space-x-2">
                    {showAuthors && (
                      <div className="flex w-full justify-between">
                        {isSuperAmin ? (
                          <BoardAsigneeSelector
                            selectedMember={selectedMember}
                            setSelectedMember={setSelectedMember}
                            className={
                              'max-w-[250px] overflow-hidden text-left'
                            }
                            members={retrospective?.members}
                          />
                        ) : (
                          <div className="flex flex-auto items-center space-x-4">
                            <Avatar>
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-xs">
                              <p className="truncate">
                                {comment.assignee
                                  ? comment.assignee
                                  : 'Anonymous'}{' '}
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
                </div>
                {isAllowedToUpdate && (
                  <button
                    onClick={() => {
                      UpdateComment('', comment.votes);
                    }}
                    className="flex items-center justify-center space-x-2 mt-5 bg-[#F4F4F5] rounded-md hover:bg-gray-50 px-4 py-2 w-full text-sm font-medium"
                  >
                    <Image src={update} alt="update"></Image>
                    <p>Update</p>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="">
      <div className="relative">
        <div className="bg-white hover:bg-zinc-50 p-6 border rounded-md shadow-sm">
          <div className="flex justify-between w-full">
            <div className="flex space-x-2 w-full">
              <If condition={comment.author === 'user1@retroteam.ai'}>
                <div className="w-[2px] h-[34px] bg-orange-300"></div>
              </If>
              <Paragraph
                description={description}
                onDoubleClickEvent={() => {
                  if (isAllowedToUpdate) {
                    setEditCard(comment.id);
                    setShowMenu(false);
                  }
                }}
              />
            </div>

            {(isAllowedToDelete || isAllowedToUpdate) && (
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
              {showAuthors && (
                <div className="flex w-full">
                  {isAllowedToUpdate ? (
                    <div className="flex space-x-2">
                      <BoardAsigneeSelector
                        selectedMember={selectedMember}
                        setSelectedMember={setSelectedMember}
                        className={'max-w-[250px] overflow-hidden text-left'}
                        members={retrospective?.members}
                      />

                      {selectedMember != '' && isAllowedToUpdate && (
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
                  ) : (
                    <div className="flex flex-auto items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="truncate">
                          {comment.assignee ? comment.assignee : 'Anonymous'}{' '}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {isVoting && isAllowedToVote && (
                <div className="flex space-x-2">
                  <button
                    disabled={loadingVotes || hasDone}
                    onClick={decrementVote}
                    className="w-[25px] h-[25px] my-auto disabled:bg-gray-50 disabled:border-orange-300 border border-orange-500 hover:border-orange-400 rounded-full"
                  >
                    <Image className="m-auto" alt="minus" src={minus} />
                  </button>
                  <p className="font-medium text-xl m-auto">{votingCard}</p>
                  <button
                    disabled={loadingVotes || isDoneVoting || hasDone}
                    onClick={incrementVote}
                    className="w-[25px] h-[25px] disabled:bg-orange-300  my-auto  bg-orange-500 hover:bg-orange-400 rounded-full"
                  >
                    <Image className="m-auto" alt="plus" src={plus} />
                  </button>
                </div>
              )}
              {isAction && (
                <div className="w-full cursor-pointer flex justify-end">
                  <button className="flex w-6 h-6">
                    <div className="bg-orange-500 w-full text-white rounded-full ">
                      {comment.votes}
                    </div>
                  </button>
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
            {isAllowedToUpdate && (
              <button
                className="flex space-x-2"
                onClick={() => setEditCard(comment.id)}
              >
                <Image src={edit} alt="edit"></Image>
                <p className="text-sm">Edit</p>
              </button>
            )}
            {isAllowedToDelete && (
              <button
                onClick={showDeleteModalHandler}
                className="flex space-x-2"
              >
                <Image src={trash} alt="delete"></Image>
                <p className="text-sm">Delete</p>
              </button>
            )}
          </div>
        )}
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

export default BoardCard;
