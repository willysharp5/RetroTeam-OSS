import { useEffect, useState } from 'react';
import toaster from 'react-hot-toast';

import Image from 'next/image';

import { Comment, Group, Tag } from '~/lib/board/types/types';

import BoardCard from './BoardCard';
import CommentCard from '../../GroupPage/board/CommentCard';

import update from 'public/assets/svg/update.svg';
import x from 'public/assets/svg/x.svg';
import edit from 'public/assets/svg/edit-3.svg';
import toggleexpand from 'public/assets/svg/double-arrow-down-gray.svg';
import arrowUp from 'public/assets/svg/double-arrow-up.svg';
import plusOrange from 'public/assets/svg/plus-square-orange.svg';
import plus from 'public/assets/svg/plus-square.svg';
import minus from 'public/assets/svg/minus-orange.svg';
import plusWhite from 'public/assets/svg/plus-white.svg';

import { XCircleIcon } from '@heroicons/react/24/outline';

import { v4 as uuidv4 } from 'uuid';

import If from '~/core/ui/If';
import useDetatchAllDemoComments from '~/lib/demo/hooks/use-detatch-all-demo-comments';
import useUpdateDemoGroup from '~/lib/demo/hooks/use-update-demo-group';
import { Avatar, AvatarFallback } from '~/core/ui/Avatar';

export default function ExpandiblePopover({
  tasks,
  groups,
  closeModalHandler,
  deleteTask,
  detatchTask,
  detatchAllTask,
  updateTask,
  columnFilter,
  retrospective,
  tags,
  numberVotes,
  isVoting = false,
  voteNumber,
  isAction = false,
  isDoneVoting,
  loadingVotes,
  setLoadingVotes,
  isSuperAdmin,
  totalVotes,
  showAuthors,
}: any) {
  const [editCard, setEditCard] = useState('');

  return (
    <div className="absolute z-100">
      <div className="flex items-center justify-center">
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50">
          <div className="bg-gray-100 w-[90%] h-[90%] p-6 rounded-lg shadow-lg overflow-y-auto">
            <div className="flex justify-between">
              <p className="text-xl font-medium">{columnFilter}</p>
              <button onClick={closeModalHandler}>
                <Image className="h-7 w-7" src={x} alt="x"></Image>
              </button>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 overflow-auto h-[90%] gap-4">
              {tasks?.map((task: Comment, index: number) => (
                <div key={index}>
                  <BoardCard
                    comment={task}
                    deleteTask={deleteTask}
                    updateTask={updateTask}
                    numberVotes={numberVotes}
                    isVoting={isVoting}
                    voteNumber={voteNumber}
                    isAction={isAction}
                    editCard={editCard}
                    setEditCard={setEditCard}
                    isDoneVoting={isDoneVoting}
                    loadingVotes={loadingVotes}
                    isSuperAmin={isSuperAdmin}
                    totalVotes={totalVotes}
                    showAuthors={showAuthors}
                    retrospective={retrospective}
                  />
                </div>
              ))}
              {groups?.map((task: Group, index: number) => (
                <div className="mx-2" key={index}>
                  <GroupCard
                    key={task.id}
                    group={task}
                    deleteTask={deleteTask}
                    detatchTask={detatchTask}
                    detatchAllTask={detatchAllTask}
                    updateTask={updateTask}
                    retrospective={retrospective}
                    overTask={''}
                    overAGroup={''}
                    activeTask={''}
                    retroTeamTags={tags}
                    numberVotes={numberVotes}
                    isVoting={isVoting}
                    isAction={isAction}
                    voteNumber={voteNumber}
                    allowed={true}
                    canGroup={true}
                    isDoneVoting={isDoneVoting}
                    loadingVotes={loadingVotes}
                    setLoadingVotes={setLoadingVotes}
                    isSuperAdmin={isSuperAdmin}
                    totalVotes={totalVotes}
                    showAuthors={showAuthors}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupCard({
  group,
  deleteTask,
  detatchTask,
  detatchAllTask,
  updateTask,
  retroTeamTags,
  retrospective,
  isVoting = false,
  numberVotes,
  voteNumber,
  isAction = false,
  isDoneVoting,
  loadingVotes,
  isSuperAdmin,
  totalVotes,
  showAuthors,
}: any) {
  const [task, setTask] = useState<Group | undefined>();
  const [votingCard, setVotingCard] = useState(0);

  useEffect(() => {
    setVotingCard(group.votes);
  }, [group]);

  const { trigger: UpdateGroup } = useUpdateDemoGroup();

  const { trigger: detatchAllComments } = useDetatchAllDemoComments(group.id);

  const [editMode, setEditMode] = useState(false);
  const [tagMenu, setTagMenu] = useState(false);
  const [isExpand, setIsExpand] = useState(false);

  const [groupName, setGroupName] = useState(group.name);

  const [tagInput, setTagInput] = useState('');
  const [groupTags, setGroupTags] = useState<Tag[]>([]);
  const [retroTags, setRetroTags] = useState<Tag[]>([]);

  const isAllowedToVote = isSuperAdmin;
  const [editCard, setEditCard] = useState('');

  const [hasDone, setHasDone] = useState(false);

  useEffect(() => {
    setGroupName(group.name);
  }, [group.name]);

  useEffect(() => {
    if (group.tags && retroTeamTags) {
      setGroupTags(group.tags);
      const uniqueRetroTags = retroTeamTags.filter((retroTag: Tag) => {
        return !groupTags.some((groupTag) => groupTag.id === retroTag.id);
      });

      setRetroTags(uniqueRetroTags);
    } else {
      setRetroTags(retroTeamTags);
    }
  }, [group, group.tags, retroTeamTags]);

  const onUpdateGroup = async (votes: number) => {
    const body = {
      id: group.id,
      name: groupName,
      status: group.status,
      order: group.order,
      tags: groupTags,
      votes,
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

    await toaster.promise(promise, {
      loading: 'Updating group',
      success: 'Group has been updated',
      error: 'Error updating group',
    });
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

  function incrementVote() {
    const hasValidVotes = numberVotes && voteNumber !== undefined;
    const canIncrement = totalVotes < numberVotes;

    if (hasValidVotes && canIncrement) {
      const totalVotes = group.votes + 1;
      group.votes = totalVotes;
      onUpdateGroup(totalVotes);
    }
  }

  function decrementVote() {
    const hasValidVotes = numberVotes && voteNumber !== undefined;
    const canDecrement = votingCard > 0;

    if (hasValidVotes && canDecrement) {
      const totalVotes = group.votes - 1;
      group.votes = totalVotes;
      onUpdateGroup(totalVotes);
    }
  }

  useEffect(() => {
    if (group) {
      setTask(group);
    }
  }, [group, group.tags]);

  if (editMode) {
    return (
      <div>
        <div className="relative">
          <div className={`bg-white p-5 border rounded-md shadow-sm space-y-6`}>
            <div className="flex justify-end">
              <button onClick={() => setEditMode(false)}>
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
              onClick={() => onUpdateGroup(group.votes)}
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
            className={`bg-white p-5 border rounded-md shadow-sm space-y-4 `}
          >
            <div className="border-b space-y-6 pb-8">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (isSuperAdmin) {
                      onUpdateGroup(group.votes);
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
                  disabled={!isSuperAdmin}
                  className="w-full p-2 text-sm rounded-md border border-[#E4E4E7]"
                  value={tagInput}
                  placeholder="Enter custom tags"
                  onChange={(e) => setTagInput(e.target.value)}
                ></input>
              </div>

              <button
                disabled={!isSuperAdmin}
                onClick={AddTag}
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
                      disabled={!isSuperAdmin}
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
            <div className="space-y-4">
              <p className="font-sm font-medium">RetroTeam</p>
              <div className="flex flex-wrap mt-6 space-y-4">
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
      <div>
        <div className="relative">
          <div className={`bg-white p-5 border rounded-md shadow-sm`}>
            <div className="flex justify-between">
              <p className="text-[#71717A] text-sm font-normal">
                {group.comments.length} comments
              </p>
              <button onClick={() => setIsExpand(false)}>
                <Image src={arrowUp} alt="arrowUp"></Image>
              </button>
            </div>
            <div className="mt-8">
              <span
                className={`text-base font-semibold ${
                  group.aiGroup ? 'text-orange-500' : ''
                }`}
              >
                {groupName != '' ? groupName : 'Group Title'}
              </span>
            </div>
            <div>
              {task?.comments.map((comment: any, index: number) => (
                <CommentCard
                  key={index}
                  deleteTask={deleteTask}
                  detatchTask={detatchTask}
                  DetatchAllComments={DetatchAllComments}
                  updateTask={updateTask}
                  comment={comment}
                  groupId={group.id}
                  editCard={editCard}
                  setEditCard={setEditCard}
                  isSuperAdmin={isSuperAdmin}
                  showAuthors={showAuthors}
                  retrospective={retrospective}
                ></CommentCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="relative">
        <div
          className={`bg-white hover:bg-zinc-50 p-5 border rounded-md shadow-sm`}
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
              <If condition={showAuthors}>
                <div className="flex">
                  <RenderMembers membersData={group.comments} />
                </div>
              </If>

              <If condition={isSuperAdmin}>
                <button
                  onClick={() => setEditMode(true)}
                  className="w-12 h-8 bg-[#F4F4F5] rounded-md"
                >
                  <Image className="m-auto" src={edit} alt="edit"></Image>
                </button>
              </If>
            </div>
            <div className="flex mt-6 justify-between">
              <div
                className="flex mt-6 flex-wrap  space-x-0.5"
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
            {isVoting && isAllowedToVote && (
              <div className="mt-6 items-center flex justify-end space-x-2">
                <button
                  disabled={loadingVotes || hasDone}
                  onClick={decrementVote}
                  className="w-[25px] h-[25px] disabled:bg-gray-50 disabled:border-orange-300 my-auto border border-orange-500 hover:border-orange-400 rounded-full"
                >
                  <Image className="m-auto" alt="minus" src={minus} />
                </button>
                <p className="font-medium text-xl m-auto">{votingCard}</p>
                <button
                  disabled={loadingVotes || isDoneVoting || hasDone}
                  onClick={incrementVote}
                  className="w-[25px] h-[25px]  my-auto disabled:bg-orange-300 bg-orange-500 hover:bg-orange-400 rounded-full"
                >
                  <Image className="m-auto" alt="plusWhite" src={plusWhite} />
                </button>
              </div>
            )}
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
