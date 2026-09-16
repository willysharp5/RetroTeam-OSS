import { useState, useEffect, useRef } from 'react';
import toaster from 'react-hot-toast';

import edit from 'public/assets/svg/edit-3.svg';
import toggleexpand from 'public/assets/svg/double-arrow-down-gray.svg';
import arrowUp from 'public/assets/svg/double-arrow-up.svg';
import plusOrange from 'public/assets/svg/plus-square-orange.svg';
import plus from 'public/assets/svg/plus-square.svg';
import update from 'public/assets/svg/update.svg';
import x from 'public/assets/svg/x.svg';
import checkCircle from 'public/assets/svg/check-circled-green.svg';
import xCircle from 'public/assets/svg/x-circle.svg';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import Image from 'next/image';

import UserImage from '~/components/dashboard/UserImage';

import { Group, GroupCardProps, Tag } from '~/lib/board/types/types';
import useUpdateGroup from '~/lib/board/hooks/use-update-group';
import { XCircleIcon } from '@heroicons/react/24/outline';
import CommentCard from './CommentCard';
import useDetatchAllComments from '~/lib/board/hooks/use-detatch-all-comments';
import minus from 'public/assets/svg/minus-orange.svg';
import plusWhite from 'public/assets/svg/plus-white.svg';
import { v4 as uuidv4 } from 'uuid';
import useVoteGroup from '~/lib/board/hooks/use-vote-group';
import { useOptimisticVoteGroup } from '~/lib/board/hooks/use-optimistic-vote-group';
import { Tooltip, TooltipContent } from '~/core/ui/Tooltip';
import { TooltipTrigger } from '@radix-ui/react-tooltip';
import If from '~/core/ui/If';
import { boardPermissions } from '~/components/utils/boardPermissions';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

function GroupCard({
  group,
  deleteTask,
  detatchTask,
  detatchAllTask,
  updateTask,
  organizationId,
  teamId,
  retrospectiveId,
  retroTeamTags,
  overAGroup,
  retrospective,
  currentUser,
  active,
  numberVotes,
  isVoting,
  isAction,
  voteNumber,
  allowed,
  canGroup,
  rules,
  userId,
  currentUserRole,
  confirmAIGrouping,
  isDoneVoting,
  loadingVotes,
  setLoadingVotes,
  myTotalVotes,
  maxVotesGlobal,
}: GroupCardProps) {
  const [task, setTask] = useState<Group | undefined>();
  const [votingCard, setVotingCard] = useState(0);
  const [isVotingInProgress, setIsVotingInProgress] = useState(false);
  const votingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const votingQueueRef = useRef<Array<{vote: number, timestamp: number}>>([]);
  const isProcessingQueueRef = useRef(false);

  const { trigger: UpdateGroup } = useUpdateGroup();
  const { trigger: voteGroup } = useVoteGroup();
  const { voteWithOptimisticUpdate } = useOptimisticVoteGroup();
  const { trigger: detatchAllComments } = useDetatchAllComments(
    organizationId,
    retrospective.id,
    group.id,
  );
  const ref = useRef<HTMLDivElement>(null);

  const [editMode, setEditMode] = useState(false);
  const [tagMenu, setTagMenu] = useState(false);
  const [isExpand, setIsExpand] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [groupName, setGroupName] = useState(group.name);

  const [tagInput, setTagInput] = useState('');
  const [groupTags, setGroupTags] = useState<Tag[]>([]);
  const [retroTags, setRetroTags] = useState<Tag[]>([]);

  const [isAllowedToVote, setIsAllowedToVote] = useState(false);

  const [hasDone, setHasDone] = useState(false);

  // Use ref to store the most up-to-date myTotalVotes value
  const myTotalVotesRef = useRef(myTotalVotes);
  myTotalVotesRef.current = myTotalVotes;

  const VoteGroup = (newVote: number) => {
    voteWithOptimisticUpdate(
      group.id,
      group,
      newVote,
      currentUser.uid,
      organizationId,
      retrospectiveId,
      updateTask,
      () => {
        console.log('Group vote updated successfully');
      },
      () => {
        console.error('Error updating group vote');
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
              group.id,
              group,
              voteItem.vote,
              currentUser.uid,
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
    if (retrospective && rules) {
      const permissions = boardPermissions(
        retrospective,
        rules,
        currentUserRole,
        undefined,
        currentUser.uid,
        currentUser.isAnonymous || !currentUser.email,
        false,
      );
      setIsAllowedToVote(permissions.isAllowedToVote);

      setHasDone(permissions.isDoneVoting);
    }
  }, [retrospective, rules, currentUserRole]);

  const onUpdateGroup = async (type: string) => {
    const body = {
      id: group.id,
      name: groupName,
      organizationId,
      retrospectiveId,
      status: group.status,
      order: group.order,
      tags: groupTags,
      votes: group.votes,
      voters: group.voters,
    };

    const promise = UpdateGroup(body)
      .then((res: any) => {
        if (res.success) {
          group.name = groupName;
          group.tags = groupTags;
          setEditMode(false);
          setTagMenu(false);
          //  if (updateGroups) updateGroups(group.id, group);
        }
      })
      .catch((e: any) => {
        console.error('ERROR onUpdateGroup', e);
      });
    if (type === 'title') {
      await toaster.promise(promise, {
        loading: 'Updating Group Title',
        success: 'Group Title updated',
        error: 'Error updating group title',
      });
    } else if (type === 'tags') {
      await toaster.promise(promise, {
        loading: 'Updating Group Tags',
        success: 'Group Tags have been updated',
        error: 'Error updating group tags',
      });
    } else {
      await toaster.promise(promise, {
        loading: 'Updating group',
        success: 'Group has been updated',
        error: 'Error updating group',
      });
    }
  };

  /*const onVoteGroup = async (votes: number, userVotes: number) => {
    if (setLoadingVotes) setLoadingVotes(true);
    const body = {
      id: group.id,
      votes: votes,
      organizationId,
      retrospectiveId,
      userId: currentUser.uid,
      userVotes,
    };
    const promise = voteGroup(body)
      .then((res: any) => {
        if (res.success) {
          if (setLoadingVotes) setLoadingVotes(false);
        }
      })
      .catch((e: any) => {
        console.error('ERROR onVoteGroup', e);
        if (setLoadingVotes) setLoadingVotes(false);
      });

    await toaster.promise(promise, {
      loading: 'Updating votes group',
      success: 'Vote has been updated',
      error: 'Error voting group',
    });
  };*/

  const DetatchAllComments = async () => {
    const promise = detatchAllComments()
      .then((res: any) => {
        if (res.success) {
          detatchAllTask(group.id);
        }
      })
      .catch((e) => {
        console.error('ERROR DetatchAllComments', e);
      });

    await toaster.promise(promise, {
      loading: 'Deatching all comments',
      success: 'All comments has been detatched',
      error: 'Error detatching all comments',
    });
  };

  const AddTag = () => {
    if (tagInput != '') {
      const id = uuidv4();
      setGroupTags([...groupTags, { name: tagInput, id: id }]);
      setTagInput('');
    }
  };

  const DelteTag = (tag: Tag) => {
    const newTags = groupTags.filter((item: Tag) => item.id !== tag.id);
    setGroupTags(newTags);
    if (tag.id.startsWith('retro')) {
      setRetroTags([...retroTags, tag]);
    }
  };

  const handleAddTag = (tag: Tag) => {
    setGroupTags([...groupTags, tag]);
    const newTags = retroTags.filter((tagR: Tag) => tagR.id !== tag.id);
    setRetroTags(newTags);
  };

  useEffect(() => {
    setGroupName(group.name);
  }, [group.name]);

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
    if (group) {
      setTask(group);

      if (group.tags) {
        setGroupTags(group.tags);
        const uniqueRetroTags = retroTeamTags.filter((retroTag) => {
          return !groupTags.some((groupTag) => groupTag.id === retroTag.id);
        });
        setRetroTags(uniqueRetroTags);
      } else {
        setRetroTags(retroTeamTags);
      }
    }
  }, [group, group.tags, retroTeamTags]);

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

  // Sync votingCard with server data every 500ms only if necessary
  useEffect(() => {
    if (!group || !currentUser) return;

    const interval = setInterval(() => {
      const serverVotes = group.voters?.[currentUser.uid]?.votes || 0;
      const localVotes = votingCard;

      // Only update if server data is different from local data
      if (serverVotes !== localVotes) {
        setVotingCard(serverVotes);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [group, currentUser, votingCard]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: group?.id ?? '',
    data: {
      type: 'Group',
      task,
    },
    disabled: editMode,
    animateLayoutChanges: () => false,
  });

  const [errorTag, setErrorTag] = useState(false);

  const [editCard, setEditCard] = useState('');

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (overAGroup === group.id && canGroup) {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div className="relative border border-orange-500 border-dashed rounded-md shadow-sm">
          <div className="absolute inset-0 flex items-center justify-center text-orange-500 text-center w-full h-full">
            Group
          </div>
          <div
            className={`bg-white  opacity-0 p-5 border rounded-md shadow-sm`}
          >
            <div className="flex justify-between">
              <p className="text-[#71717A] text-sm font-normal">
                {group.comments.length} comments
              </p>
              <button onClick={() => setIsExpand(true)}>
                <Image src={toggleexpand} alt="toggleexpand"></Image>
              </button>
            </div>
            <div className="mt-8">
              <div className="flex justify-between">
                <span
                  className={`text-base font-semibold ${
                    group.aiGroup ? 'text-orange-500' : ''
                  }`}
                >
                  {groupName != '' ? groupName : 'Group Title'}
                </span>
                <If
                  condition={
                    group.aiGroup &&
                    currentUserRole === MembershipRole.Facilitator
                  }
                >
                  <div className="flex">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() =>
                            confirmAIGrouping && confirmAIGrouping(group)
                          }
                          className="w-8 h-8 rounded-md"
                        >
                          <Image
                            className="m-auto"
                            src={checkCircle}
                            alt="confirm changes"
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Confirm AI grouping</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => DetatchAllComments()}
                          className="w-8 h-8 rounded-md"
                        >
                          <Image
                            className="m-auto"
                            src={xCircle}
                            alt="discard changes"
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Discard AI grouping</TooltipContent>
                    </Tooltip>
                  </div>
                </If>
              </div>
              <div className="mt-[18px] border-b pb-8 flex justify-between">
                <div className="flex">
                  <RenderMembers
                    membersData={group.comments}
                    organizationId={organizationId}
                  />
                </div>
                <button
                  onClick={() => setEditMode(true)}
                  className="w-12 bg-[#F4F4F5] rounded-md"
                >
                  <Image className="m-auto" src={edit} alt="edit"></Image>
                </button>
              </div>
              <div className="flex justify-between">
                <div
                  className="flex flex-wrap mt-6 space-x-0.5"
                  style={{ maxWidth: '254px' }}
                >
                  {groupTags.map((tag: Tag, index: number) => (
                    <div
                      key={index}
                      className="flex-none border rounded-md px-2.5 py-0.5 mb-0.5"
                    >
                      <p className="text-xs font-semibold text-[#09090B80]">
                        {tag.name}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setTagMenu(true)}
                  className="w-12 bg-[#F4F4F5] rounded-md h-8 my-auto"
                >
                  <Image className="m-auto" src={plusOrange} alt="plus"></Image>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (editMode) {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div className="relative cursor-grab">
          <div className={`bg-white p-5 border rounded-md shadow-sm space-y-6`}>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setGroupName(group.name);
                  setEditMode(false);
                }}
              >
                <Image src={x} alt="x"></Image>
              </button>
            </div>

            <input
              className="w-full min-h-[80px] p-2 text-sm rounded-md border border-[#E4E4E7]"
              value={groupName}
              placeholder="Group Title"
              onChange={(e) => setGroupName(e.target.value)}
            ></input>

            <button
              onClick={() => onUpdateGroup('title')}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-md bg-[#F4F4F5] hover:bg-gray-50"
            >
              <Image src={update} alt="update"></Image>
              <p>Update</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tagMenu) {
    return (
      <div>
        <div className="relative">
          <div
            className={`bg-white p-5 border rounded-md shadow-sm ${
              (isFocused || active) && 'border-orange-500'
            }`}
            ref={ref}
            onClick={() => setIsFocused(true)}
          >
            <div className="border-b space-y-6 pb-8">
              <div className="flex justify-end">
                <button onClick={() => onUpdateGroup('tags')}>
                  <Image src={x} alt="x"></Image>
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Custom</p>
                <input
                  className={`w-full p-2 text-sm rounded-md border border-[#E4E4E7]   ${
                    errorTag
                      ? 'focus:outline-none focus:border-red-500 border-red-500'
                      : ''
                  }`}
                  value={tagInput}
                  placeholder="Enter custom tags"
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (tagInput !== '') {
                        setErrorTag(false);
                        AddTag();
                      } else {
                        setErrorTag(true);
                      }
                    }
                  }}
                ></input>
              </div>

              <button
                onClick={() => {
                  if (tagInput !== '') {
                    setErrorTag(false);
                    AddTag();
                  } else {
                    setErrorTag(true);
                  }
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-md bg-[#F4F4F5] hover:bg-gray-50"
              >
                <Image src={plus} alt="plus"></Image>
                <p>Create</p>
              </button>
              <div className="flex flex-wrap mt-6 space-x-2">
                {groupTags.map((tag: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between space-x-3 border rounded-md px-2.5 pr-0 py-0.5 mb-0.5"
                  >
                    <p className="text-xs font-semibold text-[#09090B80]">
                      {tag.name}
                    </p>
                    <button
                      className="bg-gray-100 rounded-md text-black cursor-pointer"
                      onClick={() => {
                        DelteTag(tag);
                      }}
                    >
                      <XCircleIcon className="text-black h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <p className="font-sm font-medium">RetroTeam</p>
              <div className="flex flex-wrap space-y-4">
                {retroTags.map((tag: Tag, index: number) => (
                  <button
                    key={index}
                    className="my-auto hover:bg-gray-50 flex-none mr-2 border rounded-md px-2.5 py-0.5 mb-0.5"
                    onClick={() => handleAddTag(tag)}
                  >
                    <p className="text-xs font-semibold text-[#09090B80]">
                      {tag.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isExpand) {
    return (
      <div ref={setNodeRef}>
        <div className="relative">
          <div
            className={`bg-white p-5 border rounded-md shadow-sm ${
              (isFocused || active) && 'border-orange-500'
            }`}
            ref={ref}
            onClick={() => setIsFocused(true)}
          >
            <div className="flex justify-between">
              <p className="text-[#71717A] text-sm font-normal">
                {group.comments.length} comments
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setIsExpand(false)}>
                    <Image src={arrowUp} alt="arrowUp"></Image>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Reduce Card</TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-8">
              <div className="flex justify-between">
                <span
                  className={`text-base font-semibold ${
                    group.aiGroup ? 'text-orange-500' : ''
                  }`}
                >
                  {groupName != '' ? groupName : 'Group Title'}
                </span>
                <If
                  condition={
                    group.aiGroup &&
                    currentUserRole === MembershipRole.Facilitator
                  }
                >
                  <div className="flex">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() =>
                            confirmAIGrouping && confirmAIGrouping(group)
                          }
                          className="w-8 h-8 rounded-md"
                        >
                          <Image
                            className="m-auto"
                            src={checkCircle}
                            alt="confirm changes"
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Confirm AI grouping</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => DetatchAllComments()}
                          className="w-8 h-8 rounded-md"
                        >
                          <Image
                            className="m-auto"
                            src={xCircle}
                            alt="discard changes"
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Discard AI grouping</TooltipContent>
                    </Tooltip>
                  </div>
                </If>
              </div>
            </div>
            <div>
              {task?.comments.map((comment: any, index: number) => (
                <If condition={comment} key={index}>
                  <CommentCard
                    teamId={teamId}
                    deleteTask={deleteTask}
                    detatchTask={detatchTask}
                    DetatchAllComments={DetatchAllComments}
                    updateTask={updateTask}
                    comment={comment}
                    organizationId={organizationId}
                    retrospective={retrospective}
                    retrospectiveId={retrospectiveId}
                    currentUser={currentUser}
                    groupId={group.id}
                    rules={rules}
                    editCard={editCard}
                    setEditCard={setEditCard}
                    currentUserRole={currentUserRole}
                  ></CommentCard>
                </If>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div className="relative cursor-grab opacity-50">
          <div className={`p-5 border rounded-md shadow-sm`}>
            <div className="flex justify-between">
              <p className="text-[#71717A] text-sm font-normal">
                {group.comments.length} comments
              </p>
              <button onClick={() => setIsExpand(true)}>
                <Image src={toggleexpand} alt="toggleexpand"></Image>
              </button>
            </div>
            <div className="mt-8">
              <div className="flex justify-between">
                <span
                  className={`text-base font-semibold ${
                    group.aiGroup ? 'text-orange-500' : ''
                  }`}
                >
                  {groupName != '' ? groupName : 'Group Title'}
                </span>
                <If
                  condition={
                    group.aiGroup &&
                    currentUserRole === MembershipRole.Facilitator
                  }
                >
                  <div className="flex">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() =>
                            confirmAIGrouping && confirmAIGrouping(group)
                          }
                          className="w-8 h-8 rounded-md"
                        >
                          <Image
                            className="m-auto"
                            src={checkCircle}
                            alt="confirm changes"
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Confirm AI grouping</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => DetatchAllComments()}
                          className="w-8 h-8 rounded-md"
                        >
                          <Image
                            className="m-auto"
                            src={xCircle}
                            alt="discard changes"
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Discard AI grouping</TooltipContent>
                    </Tooltip>
                  </div>
                </If>
              </div>
              <div className="mt-[18px] border-b pb-8 flex justify-between">
                <div className="flex">
                  <RenderMembers
                    membersData={group.comments}
                    organizationId={organizationId}
                  />
                </div>
                <button
                  onClick={() => setEditMode(true)}
                  className="w-12 bg-[#F4F4F5] rounded-md"
                >
                  <Image className="m-auto" src={edit} alt="edit"></Image>
                </button>
              </div>
              <div className="flex justify-between">
                <div
                  className="flex flex-wrap mt-6 space-x-0.5"
                  style={{ maxWidth: '254px' }}
                >
                  {groupTags.map((tag: Tag, index: number) => (
                    <div
                      key={index}
                      className="flex-none border rounded-md px-2.5 py-0.5 mb-0.5"
                    >
                      <p className="text-xs font-semibold text-[#09090B80]">
                        {tag.name}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setTagMenu(true)}
                  className="w-12 bg-[#F4F4F5] rounded-md h-8 my-auto"
                >
                  <Image className="m-auto" src={plusOrange} alt="plus"></Image>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function incrementVote() {
    if (!isAllowedToVote) return;

    if (numberVotes && votingCard >= numberVotes) {
      return;
    }

    // Calculate the vote difference for this specific card
    const currentVote = group.voters?.[currentUser.uid]?.votes || 0;
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
    const currentVote = group.voters?.[currentUser.uid]?.votes || 0;
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

  return (
    <div
      ref={allowed ? setNodeRef : null}
      style={allowed ? style : undefined}
      {...(allowed ? { ...attributes } : {})}
      {...(allowed ? { ...listeners } : {})}
    >
      <div className={`${allowed && 'cursor-grab'}  'relative`}>
        <div
          className={`bg-white hover:bg-zinc-50 p-5 border rounded-md shadow-sm ${
            (isFocused || active) && 'border-orange-500'
          }`}
          ref={ref}
          onClick={() => setIsFocused(true)}
        >
          <div className="flex justify-between">
            <p className="text-[#71717A] text-sm font-normal">
              {group?.comments?.length} comments
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setIsExpand(true)}>
                  <Image src={toggleexpand} alt="toggleexpand"></Image>
                </button>
              </TooltipTrigger>
              <TooltipContent>Expand Card</TooltipContent>
            </Tooltip>
          </div>
          <div className="mt-8">
            <div className="flex justify-between">
              <span
                className={`text-base font-semibold ${
                  group.aiGroup ? 'text-orange-500' : ''
                }`}
              >
                {groupName != '' ? groupName : 'Group Title'}
              </span>
              <If
                condition={
                  group.aiGroup &&
                  currentUserRole === MembershipRole.Facilitator
                }
              >
                <div className="flex">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          confirmAIGrouping && confirmAIGrouping(group)
                        }
                        className="w-8 h-8 rounded-md"
                      >
                        <Image
                          className="m-auto"
                          src={checkCircle}
                          alt="confirm changes"
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Confirm AI grouping</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => DetatchAllComments()}
                        className="w-8 h-8 rounded-md"
                      >
                        <Image
                          className="m-auto"
                          src={xCircle}
                          alt="discard changes"
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Discard AI grouping</TooltipContent>
                  </Tooltip>
                </div>
              </If>
            </div>
            <div
              className={`mt-[18px] border-b pb-8 flex ${
                retrospective.authors ? 'justify-between' : 'justify-end'
              }`}
            >
              <If condition={retrospective.authors}>
                <div className="flex">
                  <RenderMembers
                    membersData={group.comments}
                    organizationId={organizationId}
                  />
                </div>
              </If>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setEditMode(true)}
                    className="w-12 h-8 bg-[#F4F4F5] rounded-md"
                  >
                    <Image className="m-auto" src={edit} alt="edit"></Image>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Edit Group Title</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex  mt-6 justify-between">
              <div
                className="flex  flex-wrap space-x-0.5"
                style={{ maxWidth: '254px' }}
              >
                {groupTags.map((tag: Tag, index: number) => (
                  <div
                    key={index}
                    className="flex border rounded-md items-center justify-center px-2.5 py-0.5 mb-0.5"
                  >
                    <p className="text-xs font-semibold text-[#09090B80]">
                      {tag.name}
                    </p>
                  </div>
                ))}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setTagMenu(true)}
                    className="w-12 bg-[#F4F4F5] rounded-md h-8 my-auto"
                  >
                    <Image
                      className="m-auto"
                      src={plusOrange}
                      alt="plus"
                    ></Image>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Add Tags - This is used for Analytics
                </TooltipContent>
              </Tooltip>
            </div>
            <If condition={isVoting && isAllowedToVote}>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  disabled={loadingVotes || hasDone || isVotingInProgress}
                  onClick={decrementVote}
                  className="w-[25px] h-[25px] disabled:bg-gray-50 disabled:border-orange-300  my-auto  border border-orange-500 hover:border-orange-400 rounded-full"
                >
                  <Image className="m-auto" alt="minus" src={minus} />
                </button>
                <p className="font-medium text-xl m-auto">{votingCard}</p>
                <button
                  disabled={loadingVotes || isDoneVoting || hasDone || isVotingInProgress}
                  onClick={incrementVote}
                  className="w-[25px] h-[25px]  my-auto disabled:bg-orange-300 bg-orange-500 hover:bg-orange-400 rounded-full"
                >
                  <Image className="m-auto" alt="plusWhite" src={plusWhite} />
                </button>
              </div>
            </If>

            {isAction && (
              <div className="mt-6 flex justify-end space-x-2">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">{group.votes}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const RenderMembers = ({ membersData, organizationId }: any) => {
  const members = membersData.slice(0, 4);
  const totalMembers = membersData.length;
  const renderedMembers = [];

  for (let i = 0; i < members.length; i++) {
    const isFirstMember = i === 0;
    const marginLeftClass = isFirstMember ? '' : '-ml-3';

    if (members[i] != null) {
      renderedMembers.push(
        <div key={i} className={`relative ${marginLeftClass}`}>
          <UserImage
            organizationId={organizationId}
            selectedMember={members[i].assignee}
          />
        </div>,
      );
    }
  }

  return (
    <div className="flex items-center">
      {renderedMembers}
      {totalMembers > 4 && (
        <div className="-ml-3 flex items-center space-x-2 py-4 min-w-8">
          <div
            className="bg-rose-300 flex justify-center rounded-full h-8 z-10"
            style={{ minWidth: 32 }}
          >
            <p className="font-normal font-semibold text-sm  my-auto">
              {' '}
              + {totalMembers - 4}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupCard;
