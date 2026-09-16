import { useState, useEffect, useRef } from 'react';
import toaster from 'react-hot-toast';

import edit from 'public/assets/svg/edit-3.svg';
import toggleexpand from 'public/assets/svg/double-arrow-down-gray.svg';
import arrowUp from 'public/assets/svg/double-arrow-up.svg';
import plusOrange from 'public/assets/svg/plus-square-orange.svg';
import plus from 'public/assets/svg/plus-square.svg';
import update from 'public/assets/svg/update.svg';
import x from 'public/assets/svg/x.svg';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import Image from 'next/image';

import { Group, Tag } from '~/lib/board/types/types';

import { XCircleIcon } from '@heroicons/react/24/outline';
import CommentCard from './CommentCard';

import minus from 'public/assets/svg/minus-orange.svg';
import plusWhite from 'public/assets/svg/plus-white.svg';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip, TooltipContent } from '~/core/ui/Tooltip';
import { TooltipTrigger } from '@radix-ui/react-tooltip';
import If from '~/core/ui/If';
import { Avatar, AvatarFallback } from '~/core/ui/Avatar';
import useUpdateDemoGroup from '~/lib/demo/hooks/use-update-demo-group';
import useDetatchAllDemoComments from '~/lib/demo/hooks/use-detatch-all-demo-comments';

function GroupCard({
  group,
  deleteTask,
  detatchTask,
  detatchAllTask,
  updateTask,
  retroTeamTags,
  overAGroup,
  retrospective,
  active,
  numberVotes,
  isVoting,
  isAction,
  voteNumber,
  allowed,
  canGroup,
  isDoneVoting,
  loadingVotes,
  totalVotes,
  isSuperAdmin,
  showAuthors
}: any) {
  const [task, setTask] = useState<Group | undefined>();
  const [votingCard, setVotingCard] = useState(0);

  useEffect(() => {
    setVotingCard(group.votes);
  }, [group]);

  const { trigger: UpdateGroup } = useUpdateDemoGroup();
  const { trigger: detatchAllComments } = useDetatchAllDemoComments(group.id);

  const ref = useRef<HTMLDivElement>(null);

  const [editMode, setEditMode] = useState(false);
  const [tagMenu, setTagMenu] = useState(false);
  const [isExpand, setIsExpand] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [groupName, setGroupName] = useState(group.name);

  const [tagInput, setTagInput] = useState('');
  const [groupTags, setGroupTags] = useState<Tag[]>([]);
  const [retroTags, setRetroTags] = useState<Tag[]>([]);

  const [hasDone, setHasDone] = useState(false);

  useEffect(() => {
    setHasDone(false);
  }, [retrospective]);

  const onUpdateGroup = async (type: string, votes: number) => {
    const body = {
      id: group.id,
      name: groupName,
      status: group.status,
      order: group.order,
      tags: groupTags,
      votes: votes,
      voters: group.voters,
    };
    
    const promise = UpdateGroup(body)
      .then((res: any) => {
        if (res.success) {
          group.name = groupName;
          group.tags = groupTags;
          setEditMode(false);
          setTagMenu(false);
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
        const uniqueRetroTags = retroTeamTags.filter((retroTag: Tag) => {
          return !groupTags.some((groupTag) => groupTag.id === retroTag.id);
        });
        setRetroTags(uniqueRetroTags);
      } else {
        setRetroTags(retroTeamTags);
      }
    }
  }, [group, group.tags, retroTeamTags]);

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
              </div>
              <div className="mt-[18px] border-b pb-8 flex justify-between">
                <div className="flex">
                  <RenderMembers membersData={group.comments} />
                </div>
                <If condition={isSuperAdmin}>
                  <button
                    onClick={() => setEditMode(true)}
                    className="w-12 bg-[#F4F4F5] rounded-md"
                  >
                    <Image className="m-auto" src={edit} alt="edit"></Image>
                  </button>
                </If>
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
              onClick={() => onUpdateGroup('title', group.votes)}
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
                <button
                  onClick={() => {
                    if (isSuperAdmin) {
                      onUpdateGroup('tags', group.votes);
                    } else {
                      setTagMenu(false);
                    }
                  }}
                >
                  <Image src={x} alt="x"></Image>
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Custom</p>
                <input
                  className={`w-full p-2 text-sm rounded-md border border-[#E4E4E7] disabled:bg-gray-100   ${
                    errorTag
                      ? 'focus:outline-none focus:border-red-500 border-red-500'
                      : ''
                  }`}
                  disabled={!isSuperAdmin}
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
                disabled={!isSuperAdmin}
                onClick={() => {
                  if (tagInput !== '') {
                    setErrorTag(false);
                    AddTag();
                  } else {
                    setErrorTag(true);
                  }
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-md bg-[#F4F4F5] disabled:hover:bg-[#F4F4F5] hover:bg-gray-50"
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
                      disabled={!isSuperAdmin}
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
                    disabled={!isSuperAdmin}
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
              </div>
            </div>
            <div>
              {task?.comments.map((comment: any, index: number) => (
                <If condition={comment} key={index}>
                  <CommentCard
                    deleteTask={deleteTask}
                    detatchTask={detatchTask}
                    DetatchAllComments={DetatchAllComments}
                    updateTask={updateTask}
                    comment={comment}
                    isSuperAdmin={isSuperAdmin}
                    showAuthors={showAuthors}
                    groupId={group.id}
                    editCard={editCard}
                    setEditCard={setEditCard}
                    retrospective={retrospective}
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
              </div>
              <div className="mt-[18px] border-b pb-8 flex justify-between">
                <div className="flex">
                  <RenderMembers membersData={group.comments} />
                </div>
                <If condition={isSuperAdmin}>
                  <button
                    onClick={() => setEditMode(true)}
                    className="w-12 bg-[#F4F4F5] rounded-md"
                  >
                    <Image className="m-auto" src={edit} alt="edit"></Image>
                  </button>
                </If>
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
    const hasValidVotes = numberVotes && voteNumber !== undefined;
    const canIncrement = totalVotes < numberVotes;

    if (hasValidVotes && canIncrement) {
      const totalVotes = group.votes + 1;
      group.votes = totalVotes;
      onUpdateGroup('', totalVotes);
    }
  }

  function decrementVote() {
    const hasValidVotes = numberVotes && voteNumber !== undefined;
    const canDecrement = votingCard > 0;

    if (hasValidVotes && canDecrement) {
      const totalVotes = group.votes - 1;
      group.votes = totalVotes;
      onUpdateGroup('', totalVotes);
    }
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
            </div>
            <div
              className={`mt-[18px] border-b pb-8 flex ${
                showAuthors ? 'justify-between' : 'justify-end'
              }`}
            >
              <If condition={showAuthors}>
                <div className="flex">
                  <RenderMembers membersData={group.comments} />
                </div>
              </If>
              <If condition={isSuperAdmin}>
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
              </If>
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
            <If condition={isVoting}>
              <div className="mt-6 flex justify-end space-x-2">
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

const RenderMembers = ({ membersData }: any) => {
  const members = membersData.slice(0, 4);
  
  const renderedMembers = [];

  for (let i = 0; i < members.length; i++) {
    const isFirstMember = i === 0;
    const marginLeftClass = isFirstMember ? '' : '-ml-3';

    if (members[i] != null) {
      
      const firstLetter = members[i].assignee
        ? members[i].assignee.trim().charAt(0).toUpperCase()
        : 'U';

      renderedMembers.push(
        <div key={i} className={`relative ${marginLeftClass}`}>
          <Avatar>
            <AvatarFallback>{firstLetter}</AvatarFallback>
          </Avatar>
        </div>,
      );
    }
  }

  return <div className="flex">{renderedMembers}</div>;
};


export default GroupCard;
