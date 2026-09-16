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
import useUpdateComments from '~/lib/board/hooks/use-update-comments';
import useDeleteComments from '~/lib/board/hooks/use-delete-comment';
import CancelContinueModal from '~/components/shared/cancelContinueModal';

import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import { useAuth } from 'reactfire';
import BoardAsigneeSelector from '../../BoardAssigneeSelector';
import UserImage from '~/components/dashboard/UserImage';
import { Comment } from '~/lib/board/types/types';
import useVoteComment, {
  useOptimisticVote,
} from '~/lib/board/hooks/use-vote-comment';
import { Rules } from '~/lib/rules/types';

import Paragraph from '~/components/shared/paragraph';
import If from '~/core/ui/If';
import DeleteModal from '~/components/shared/deleteModal';
import { boardPermissions } from '~/components/utils/boardPermissions';

interface Props {
  comment: Comment;
  organizationId: string;
  teamId: string;
  retrospectiveId: string;
  retrospective: Retrospectives;
  deleteTask: (id: Id) => void;
  updateTask: (id: string, content: Comment) => void;
  numberVotes: number;
  isVoting: boolean;
  isAction: boolean;
  voteNumber: number;
  rules: Rules;
  currentUserRole: number;
  editCard: string;
  setEditCard: (edit: string) => void;
  isDoneVoting?: boolean;
  loadingVotes?: boolean;
  setLoadingVotes?: (loading: boolean) => void;
  myTotalVotes?: number;
  maxVotesGlobal?: number;
}

function BoardCard({
  comment,
  deleteTask,
  updateTask,
  organizationId,
  teamId,
  retrospectiveId,
  retrospective,
  numberVotes,
  isVoting,
  isAction,
  voteNumber,
  rules,
  currentUserRole,
  editCard,
  setEditCard,
  isDoneVoting,
  loadingVotes,
  setLoadingVotes,
  myTotalVotes = 0,
  maxVotesGlobal = 0,
}: Props) {
  const [task, setTask] = useState<Comment | undefined>();
  const [votingCard, setVotingCard] = useState(0);
  const [isVotingInProgress, setIsVotingInProgress] = useState(false);
  const votingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const votingQueueRef = useRef<Array<{ vote: number; timestamp: number }>>([]);
  const isProcessingQueueRef = useRef(false);

  const [description, setDescription] = useState('');

  const [selectedMember, setSelectedMember] = useState('');
  const prevSelectedMemberRef = useRef<string | undefined>(undefined);

  // Use ref to store the most up-to-date myTotalVotes value
  const myTotalVotesRef = useRef(myTotalVotes);
  myTotalVotesRef.current = myTotalVotes;

  const auth = useAuth();
  const currentUser = auth?.currentUser?.uid as string;
  const isAnonymous =
    auth?.currentUser?.isAnonymous || !auth?.currentUser?.email;

  const { trigger: updateComment } = useUpdateComments();
  const { trigger: DeleteComment } = useDeleteComments(
    organizationId,
    retrospectiveId,
    comment.id,
  );
  const { trigger: voteComment } = useVoteComment();
  const { voteWithOptimisticUpdate } = useOptimisticVote();

  const [isAllowedToUpdate, setIsAllowedToUpdate] = useState(false);
  const [isAllowedToDelete, setIsAllowedToDelete] = useState(false);
  const [isAllowedToVote, setIsAllowedToVote] = useState(false);

  const [hasDone, setHasDone] = useState(false);

  useEffect(() => {
    setSelectedMember(comment.assignee);
    prevSelectedMemberRef.current = comment.assignee;
  }, [comment]);

  useEffect(() => {
    if (retrospective && rules) {
      const permissions = boardPermissions(
        retrospective,
        rules,
        currentUserRole,
        comment,
        currentUser,
        isAnonymous,
        false,
      );

      console.log('BoardCard permissions:', permissions);
      console.log('Setting permissions at votingCard:', votingCard);
      setIsAllowedToUpdate(permissions.isAllowedToUpdate);
      setIsAllowedToDelete(permissions.isAllowedToDelete);
      setIsAllowedToVote(permissions.isAllowedToVote);

      setHasDone(permissions.isDoneVoting);
    }
  }, [retrospective, rules, currentUserRole]);

  useEffect(() => {
    if (comment) {
      console.log('Comment changed, current votingCard:', votingCard);
      setDescription(comment.description);
    }
  }, [comment, comment.votes]);

  useEffect(() => {
    if (comment) {
      if (comment.voters) {
        // Initialize votingCard with current user's votes (even if 0)
        const currentUserVotes = comment.voters[currentUser]?.votes || 0;
        setVotingCard(currentUserVotes);
      } else {
        console.log('No comment.voters found');
      }
    } else {
      console.log('No comment provided');
    }
  }, [comment, currentUser]); // Remove comment.votes from dependencies

  // Add a useEffect to track votingCard changes
  useEffect(() => {
    console.log('votingCard changed to:', votingCard);
  }, [votingCard]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (votingTimeoutRef.current) {
        clearTimeout(votingTimeoutRef.current);
      }
      // Clear voting queue on unmount
      votingQueueRef.current = [];
      isProcessingQueueRef.current = false;
    };
  }, []);

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

  const UpdateComment = async (type: string) => {
    const body = {
      id: comment.id,
      description: description,
      assignee: selectedMember,
      organization: organizationId,
      teamId,
      retrospectiveId,
      status: comment.status,
      order: comment.order,
      votes: comment.votes,
      voter: comment.voters,
      group: comment.group,
    };
    const promise = updateComment(body)
      .then((res: any) => {
        if (res.success) {
          updateTask(comment.id, res.data);
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

  const VoteComment = (newVote: number) => {
    voteWithOptimisticUpdate(
      comment.id,
      comment,
      newVote,
      currentUser,
      organizationId,
      retrospectiveId,
      updateTask,
      () => {
        console.log('Vote updated successfully');
      },
      () => {
        console.error('Error updating vote');
      },
      maxVotesGlobal, // Pass the global vote limit
      myTotalVotesRef.current, // Pass the user's total votes using ref for up-to-date value
    );
  };

  // Process voting queue sequentially to ensure all votes are processed
  const processVotingQueue = async () => {
    if (isProcessingQueueRef.current || votingQueueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;

    while (votingQueueRef.current.length > 0) {
      const voteItem = votingQueueRef.current.shift();
      if (voteItem) {
        try {
          // Send vote to backend
          await new Promise<void>((resolve, reject) => {
            voteWithOptimisticUpdate(
              comment.id,
              comment,
              voteItem.vote,
              currentUser,
              organizationId,
              retrospectiveId,
              updateTask,
              () => {
                console.log(`Vote ${voteItem.vote} processed successfully`);
                resolve();
              },
              () => {
                console.error(`Error processing vote ${voteItem.vote}`);
                reject();
              },
              maxVotesGlobal,
              myTotalVotesRef.current,
            );
          });

          // Small delay to prevent overwhelming the backend
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          console.error('Error processing vote in queue:', error);
        }
      }
    }

    isProcessingQueueRef.current = false;
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
        UpdateComment('member');
        prevSelectedMemberRef.current = selectedMember;
      }
    }
  }, [selectedMember]);

  function incrementVote() {
    if (!isAllowedToVote) return;

    if (numberVotes && votingCard >= numberVotes) {
      return;
    }

    // Calculate the vote difference for this specific card
    const currentVote = comment.voters?.[currentUser]?.votes || 0;
    const newVote = votingCard + 1;
    const voteDifference = newVote - currentVote;
    const newTotalUserVotes = (myTotalVotesRef.current || 0) + voteDifference;

    // Global limit
    if (maxVotesGlobal !== undefined && newTotalUserVotes > maxVotesGlobal) {
      return;
    }

    // IMMEDIATE UI update for maximum responsiveness
    setVotingCard(newVote);

    // Add vote to queue for backend processing
    votingQueueRef.current.push({
      vote: newVote,
      timestamp: Date.now(),
    });

    // Process queue if not already processing
    if (!isProcessingQueueRef.current) {
      processVotingQueue();
    }

    // Brief visual feedback (50ms) to prevent double-clicks
    setIsVotingInProgress(true);
    if (votingTimeoutRef.current) {
      clearTimeout(votingTimeoutRef.current);
    }
    votingTimeoutRef.current = setTimeout(() => {
      setIsVotingInProgress(false);
    }, 50);
  }

  function decrementVote() {
    if (!isAllowedToVote) return;

    // Verify that it does not go below 0
    if (votingCard <= 0) {
      return; // Do not allow negative votes
    }

    // Calculate the vote difference for this specific card
    const currentVote = comment.voters?.[currentUser]?.votes || 0;
    const newVote = votingCard - 1;
    const voteDifference = newVote - currentVote;
    const newTotalUserVotes = (myTotalVotesRef.current || 0) + voteDifference;

    // Global limit
    if (maxVotesGlobal !== undefined && newTotalUserVotes > maxVotesGlobal) {
      return;
    }

    // IMMEDIATE UI update for maximum responsiveness
    setVotingCard(newVote);

    // Add vote to queue for backend processing
    votingQueueRef.current.push({
      vote: newVote,
      timestamp: Date.now(),
    });

    // Process queue if not already processing
    if (!isProcessingQueueRef.current) {
      processVotingQueue();
    }

    // Brief visual feedback (50ms) to prevent double-clicks
    setIsVotingInProgress(true);
    if (votingTimeoutRef.current) {
      clearTimeout(votingTimeoutRef.current);
    }
    votingTimeoutRef.current = setTimeout(() => {
      setIsVotingInProgress(false);
    }, 50);
  }

  if (editCard === comment.id) {
    return (
      <>
        <div className="">
          <div className="relative">
            <div className=" bg-white border rounded-md shadow-sm">
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
                    {retrospective.authors && (
                      <div className="flex w-full justify-between">
                        {comment.author === currentUser ? (
                          <BoardAsigneeSelector
                            selectedMember={selectedMember}
                            setSelectedMember={setSelectedMember}
                            organizationId={organizationId}
                            name={comment.user.fullName}
                            className={
                              'max-w-[250px] overflow-hidden text-left'
                            }
                            userId={comment.author}
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
                      UpdateComment('');
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
              <If condition={comment.author === currentUser}>
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
              {retrospective.authors && (
                <div className="flex w-full">
                  {isAllowedToUpdate ? (
                    <div className="flex space-x-2">
                      <BoardAsigneeSelector
                        selectedMember={selectedMember}
                        setSelectedMember={setSelectedMember}
                        organizationId={organizationId}
                        name={comment.user.fullName}
                        className={'max-w-[250px] overflow-hidden text-left'}
                        userId={comment.author}
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
                </div>
              )}
              {isVoting && isAllowedToVote && (
                <div className="flex space-x-2">
                  <button
                    disabled={loadingVotes || hasDone || isVotingInProgress}
                    onClick={decrementVote}
                    className="w-[25px] h-[25px] my-auto disabled:bg-gray-50 disabled:border-orange-300 border border-orange-500 hover:border-orange-400 rounded-full"
                  >
                    <Image className="m-auto" alt="minus" src={minus} />
                  </button>
                  <p className="font-medium text-xl m-auto">{votingCard}</p>
                  <button
                    disabled={
                      loadingVotes ||
                      isDoneVoting ||
                      hasDone ||
                      isVotingInProgress
                    }
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
