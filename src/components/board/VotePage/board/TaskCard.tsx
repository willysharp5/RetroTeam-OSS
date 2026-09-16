import { useState, useEffect, useRef, useCallback } from 'react';

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

import useUpdateComments from '~/lib/board/hooks/use-update-comments';
import { XCircleIcon } from '@heroicons/react/24/outline';

import CustomTextArea from '~/components/shared/textArea';
import BoardAsigneeSelector from '../../BoardAssigneeSelector';
import { useAuth } from 'reactfire';
import UserImage from '~/components/dashboard/UserImage';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import ContextMenu from '~/components/shared/contextMenu';
import useVoteComment, {
  useOptimisticVote,
} from '~/lib/board/hooks/use-vote-comment';
import { Comment } from '~/lib/board/types/types';
import toaster from 'react-hot-toast';
import { Rules } from '~/lib/rules/types';
import useFetchUserById from '~/lib/server/user/get-current-user';
import Paragraph from '~/components/shared/paragraph';
import If from '~/core/ui/If';
import useDeleteComments from '~/lib/board/hooks/use-delete-comment';
import DeleteModal from '~/components/shared/deleteModal';

import { boardPermissions } from '~/components/utils/boardPermissions';

interface Props {
  comment: Comment;
  organizationId: string;
  teamId: string;
  retrospectiveId: string;
  updateTask: (id: string, content: Comment) => void;
  retrospective: Retrospectives;
  active?: boolean;
  numberVotes: number | undefined;
  voteNumber: number;
  allowed: boolean;
  rules: Rules;
  currentUserRole: number;
  editCard: string;
  setEditCard: (card: any) => void;
  deleteTask: (id: string) => void;
  isDoneVoting: boolean;
  loadingVotes: any;
  setLoadingVotes: any;
  myTotalVotes?: number; // Total de votos del usuario en todas las cards
  maxVotesGlobal?: number; // Limite global de votos
}

function TaskCard({
  comment,
  updateTask,
  organizationId,
  teamId,
  retrospectiveId,
  retrospective,
  active,
  numberVotes,
  voteNumber,
  allowed,
  rules,
  currentUserRole,
  editCard,
  setEditCard,
  deleteTask,
  isDoneVoting,
  loadingVotes,
  setLoadingVotes,
  myTotalVotes,
  maxVotesGlobal,
}: Props) {
  const [task, setTask] = useState<Comment | undefined>();

  const [votingCard, setVotingCard] = useState(0);
  const [isVotingInProgress, setIsVotingInProgress] = useState(false);
  const votingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const votingQueueRef = useRef<Array<{vote: number, timestamp: number}>>([]);
  const isProcessingQueueRef = useRef(false);

  const [description, setDescription] = useState('');

  const [selectedMember, setSelectedMember] = useState('');
  const prevSelectedMemberRef = useRef<string | undefined>(undefined);
  const ref = useRef<HTMLDivElement>(null);

  // Use ref to store the most up-to-date myTotalVotes value
  const myTotalVotesRef = useRef(myTotalVotes);
  myTotalVotesRef.current = myTotalVotes;

  const auth = useAuth();
  const currentUser = auth?.currentUser?.uid as string;
  const isAnonymous =
    auth?.currentUser?.isAnonymous || !auth?.currentUser?.email;

  const { trigger: UpdateComments } = useUpdateComments();
  const { voteWithOptimisticUpdate } = useOptimisticVote();

  const [editMode, setEditMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isAllowedToUpdate, setIsAllowedToUpdate] = useState(false);
  const [isAllowedToDelete, setIsAllowedToDelete] = useState(false);
  const [isAllowedToVote, setIsAllowedToVote] = useState(false);

  const userData = useFetchUserById(comment.assignee);

  const { trigger: DeleteComment } = useDeleteComments(
    organizationId,
    retrospectiveId,
    comment.id,
  );

  const [hasDone, setHasDone] = useState(false);
  useEffect(() => {
    if (rules && retrospective) {
      const permissions = boardPermissions(
        retrospective,
        rules,
        currentUserRole,
        comment,
        currentUser,
        isAnonymous,
        false,
      );
      setIsAllowedToUpdate(permissions.isAllowedToUpdate);
      setIsAllowedToDelete(permissions.isAllowedToDelete);
      setIsAllowedToVote(permissions.isAllowedToVote);
      setHasDone(permissions.isDoneVoting);
    }
  }, [retrospective, rules, currentUserRole]);

  const showDeleteModalHandler = () => {
    setShowDeleteModal(true);
  };

  const closeDeleteModalHandler = () => {
    setShowDeleteModal(false);
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
      group: comment.group,
      votes: comment.votes,
      voter: comment.voters,
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
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error('Error processing vote in queue:', error);
        }
      }
    }

    isProcessingQueueRef.current = false;
  };

  useEffect(() => {
    if (comment) {
      setTask(comment);
    }
  }, [comment]);

  // Sync votingCard with server data every 500ms only if necessary
  useEffect(() => {
    if (!comment || !currentUser) return;

    const interval = setInterval(() => {
      const serverVotes = comment.voters?.[currentUser]?.votes || 0;
      const localVotes = votingCard;

      // Only update if server data is different from local data
      if (serverVotes !== localVotes) {
        setVotingCard(serverVotes);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [comment, currentUser, votingCard]);

  useEffect(() => {
    if (task) {
      setDescription(task.description);
      setSelectedMember(task.assignee);
      prevSelectedMemberRef.current = task.assignee;
    }
  }, [task]);

  // Cleanup timeout and queue on unmount
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

  useEffect(() => {
    if (editCard !== comment.id) {
      if (task && selectedMember !== prevSelectedMemberRef.current) {
        UpdateComment('member');
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

  const [name, setName] = useState('Anonymous');

  useEffect(() => {
    if (comment.user) {
      const name = comment?.user.fullName;
      setName(name);
    }
  }, [comment]);

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
      timestamp: Date.now()
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
      timestamp: Date.now()
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
                  organizationId={organizationId}
                  name={name}
                  className={'max-w-[250px] overflow-hidden text-left'}
                  userId={comment.author}
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
                  {retrospective.authors && (
                    <div className="flex justify-between w-full">
                      {isAllowedToUpdate ? (
                        <BoardAsigneeSelector
                          selectedMember={selectedMember}
                          setSelectedMember={setSelectedMember}
                          organizationId={organizationId}
                          name={name}
                          className={'max-w-[250px] overflow-hidden text-left'}
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
                              {comment.assignee !== ''
                                ? userData?.fullName
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
                    UpdateComment('');
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
            {currentUser === comment.author && (
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
              retrospective.authors ? 'justify-between' : 'justify-end'
            } space-x-6 items-center`}
          >
            <If condition={retrospective.authors}>
              <div className="flex">
                {isAllowedToUpdate ? (
                  <>
                    {' '}
                    <BoardAsigneeSelector
                      selectedMember={selectedMember}
                      setSelectedMember={setSelectedMember}
                      organizationId={organizationId}
                      name={name}
                      className={'max-w-[250px] overflow-hidden text-left'}
                      userId={comment.author}
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
                    <UserImage
                      organizationId={organizationId}
                      selectedMember={comment.assignee}
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="truncate">
                        {comment.assignee !== ''
                          ? userData?.fullName
                          : 'Anonymous'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </If>

            {isAllowedToVote && (
              <div className="flex space-x-2">
                <button
                  disabled={hasDone || isVotingInProgress}
                  onClick={decrementVote}
                  className="w-[25px] h-[25px] disabled:bg-gray-50 disabled:border-orange-300  my-auto  border border-orange-500 hover:border-orange-400 rounded-full"
                >
                  <Image className="m-auto" alt="minus" src={minus} />
                </button>
                <p className="font-medium text-xl m-auto">{votingCard}</p>
                <button
                  disabled={isDoneVoting || hasDone || isVotingInProgress}
                  onClick={incrementVote}
                  className="w-[25px] h-[25px]  my-auto disabled:bg-orange-300 bg-orange-500 hover:bg-orange-400 rounded-full"
                >
                  <Image className="m-auto" alt="plus" src={plus} />
                </button>
              </div>
            )}
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
