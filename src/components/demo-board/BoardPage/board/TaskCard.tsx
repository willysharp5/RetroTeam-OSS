import { useState, useEffect, useRef, Fragment } from 'react';
import toaster from 'react-hot-toast';

import vector from 'public/assets/svg/3-dots.svg';
import trash from 'public/assets/svg/trash.svg';
import edit from 'public/assets/svg/edit-3.svg';
import update from 'public/assets/svg/update.svg';
import x from '/public/assets/svg/x.svg';
import close from 'public/assets/svg/close.svg';

import { Task, Id } from '~/lib/actions/types/actions';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import Image from 'next/image';

import { XCircleIcon } from '@heroicons/react/24/outline';
import { TooltipContent, Tooltip, TooltipTrigger } from '~/core/ui/Tooltip';

import CustomTextArea from '~/components/shared/textArea';
import BoardAsigneeSelector from '../../BoardAssigneeSelector';

import { Comment } from '~/lib/board/types/types';

import If from '~/core/ui/If';

import Paragraph from '~/components/shared/paragraph';
import DeleteModal from '~/components/shared/deleteModal';
import useUpdateDemoComments from '~/lib/demo/hooks/use-update-demo-comment';
import { Avatar, AvatarFallback } from '~/core/ui/Avatar';
import useDeleteDemoComments from '~/lib/demo/hooks/use-delete-demo-comments';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';

interface Props {
  comment: Comment;
  deleteTask: (id: Id) => void;
  updateTask: any;
  groupMode: boolean;
  activeTask: any;
  overTask: any;
  active?: boolean;
  allowed: boolean;
  isAction?: boolean;
  canGroup?: boolean;
  editCard: string;
  setEditCard: (card: any) => void;
  isSuperAdmin: boolean;
  showAuthors: boolean;
  retrospective: Retrospectives;
}

function TaskCard({
  comment,
  deleteTask,
  updateTask,
  groupMode,
  activeTask,
  overTask,
  active,
  allowed,
  isAction = false,
  canGroup = false,
  editCard,
  setEditCard,
  isSuperAdmin,
  showAuthors,
  retrospective,
}: Props) {
  const [task, setTask] = useState<Task | any>();

  const [description, setDescription] = useState('');

  const [selectedMember, setSelectedMember] = useState('');
  const prevSelectedMemberRef = useRef<string | undefined>(undefined);
  const ref = useRef<HTMLDivElement>(null);

  const { trigger: UpdateComments } = useUpdateDemoComments();
  const { trigger: DeleteComment } = useDeleteDemoComments(comment.id);

  const [editMode, setEditMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  const [isAllowedToUpdate] = useState(isSuperAdmin);
  const [isAllowedToDelete] = useState(isSuperAdmin);

  const ProfileAvatar: React.FC<{ selectedMember: string }> = ({
    selectedMember,
  }) => {
    return selectedMember !== '' ? (
      <Avatar>
        <AvatarFallback>
          {selectedMember.trim().charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    ) : (
      <div>
        <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-gray-300 font-semibold uppercase text-white"></span>
        </span>
      </div>
    );
  };

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

  const UpdateComment = async (type: string) => {
    const body = {
      id: comment.id,
      description: description,
      assignee: selectedMember,
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

  useEffect(() => {
    if (comment) {
      setTask(comment);
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

  const onDoubleClickEvent = () => {
    if (isAllowedToUpdate) {
      setEditCard(comment.id);
      setEditMode(true);
    }
  };

  // Edit mode
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
                <div className="mt-6 flex w-full space-x-2 items-center">
                  <If condition={showAuthors}>
                    <div className="flex w-full">
                      {isAllowedToUpdate ? (
                        <>
                          <BoardAsigneeSelector
                            selectedMember={selectedMember}
                            setSelectedMember={setSelectedMember}
                            className={
                              'max-w-[250px] overflow-hidden text-left'
                            }
                            members={retrospective?.members}
                          />
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
                        </>
                      ) : (
                        <div className="flex flex-auto items-center space-x-4">
                          <ProfileAvatar selectedMember={comment.assignee} />
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
                </div>
                <button
                  onClick={() => {
                    UpdateComment('');
                  }}
                  className="flex items-center justify-center space-x-2 mt-5 bg-[#F4F4F5] rounded-md hover:bg-gray-50 px-4 py-2 w-full text-sm font-medium"
                >
                  <Image src={update} alt="update"></Image>
                  <p>Update</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Dragging mode
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
                onClick={handleClick}
              >
                {description.split('\n').map((line, index) => (
                  <Fragment key={index}>
                    {line}
                    <br />
                  </Fragment>
                ))}
              </p>
            </div>
            <div className="mt-6 flex w-full">
              {showAuthors && (
                <div className="w-full">
                  {isAllowedToUpdate ? (
                    <BoardAsigneeSelector
                      selectedMember={selectedMember}
                      setSelectedMember={setSelectedMember}
                      className={'max-w-[250px] overflow-hidden text-left'}
                      members={retrospective?.members}
                    />
                  ) : (
                    <div className="flex flex-auto items-center space-x-4">
                      <ProfileAvatar selectedMember={comment.assignee} />
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
              )}
              <div className="w-full cursor-pointer flex justify-end">
                {isAllowedToUpdate && (
                  <div className="w-full cursor-pointer flex justify-end">
                    <button
                      className="flex w-h w-6"
                      onClick={() => setShowMenu(!showMenu)}
                    >
                      <Image
                        className="ml-auto"
                        src={vector}
                        alt="menu vector"
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active mode
  if (groupMode && activeTask && activeTask.id === comment.id && canGroup) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className=""
      >
        <div className="relative cursor-grab opacity-50 ">
          <div className=" bg-white p-6 border border-orange-500 rounded-md shadow-sm">
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
                onClick={handleClick}
              >
                {description.split('\n').map((line, index) => (
                  <Fragment key={index}>
                    {line}
                    <br />
                  </Fragment>
                ))}
              </p>
            </div>
            <div className="mt-6 flex w-full">
              {showAuthors && (
                <div className="w-full">
                  {isAllowedToUpdate ? (
                    <BoardAsigneeSelector
                      selectedMember={selectedMember}
                      setSelectedMember={setSelectedMember}
                      className={'max-w-[250px] overflow-hidden text-left'}
                      members={retrospective?.members}
                    />
                  ) : (
                    <div className="flex flex-auto items-center space-x-4">
                      <ProfileAvatar selectedMember={comment.assignee} />
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
              )}
              <div className="w-full cursor-pointer flex justify-end">
                {isAllowedToUpdate && (
                  <div className="w-full cursor-pointer flex justify-end">
                    <button
                      className="flex w-h w-6"
                      onClick={() => setShowMenu(!showMenu)}
                    >
                      <Image
                        className="ml-auto"
                        src={vector}
                        alt="menu vector"
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Over mode (GROUP MODE)
  if (groupMode && overTask === comment.id && canGroup) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="relative border border-orange-500 border-dashed rounded-md shadow-sm"
      >
        <div className="absolute inset-0 flex items-center justify-center text-orange-500 text-center w-full h-full">
          Group
        </div>
        <div className="relative cursor-grab opacity-0">
          <div className="p-6">
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
                onClick={handleClick}
              >
                {description.split('\n').map((line, index) => (
                  <Fragment key={index}>
                    {line}
                    <br />
                  </Fragment>
                ))}
              </p>
            </div>
            <div className="mt-6 flex w-full">
              {showAuthors && (
                <div className="w-full">
                  {isAllowedToUpdate ? (
                    <BoardAsigneeSelector
                      selectedMember={selectedMember}
                      setSelectedMember={setSelectedMember}
                      className={'max-w-[250px] overflow-hidden text-left'}
                      members={retrospective?.members}
                    />
                  ) : (
                    <div className="flex flex-auto items-center space-x-4">
                      <ProfileAvatar selectedMember={comment.assignee} />
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
              )}
              <div className="w-full cursor-pointer flex justify-end">
                {isAllowedToUpdate && (
                  <div className="w-full cursor-pointer flex justify-end">
                    <button
                      className="flex w-h w-6"
                      onClick={() => setShowMenu(!showMenu)}
                    >
                      <Image
                        className="ml-auto"
                        src={vector}
                        alt="menu vector"
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Tooltip>
      <div
        ref={allowed ? setNodeRef : null}
        style={allowed ? style : undefined}
        {...(allowed ? { ...attributes } : {})}
        {...(allowed ? { ...listeners } : {})}
        className=""
      >
        <TooltipTrigger
          asChild
          className={`${allowed && 'cursor-grab'}  'relative w-full text-left`}
        >
          <div
            ref={ref}
            onClick={() => setIsFocused(true)}
            className={`bg-white hover:bg-zinc-50 p-5 border rounded-md shadow-sm ${
              (isFocused || active) && 'border-orange-500'
            }`}
          >
            <div className="flex justify-between w-full space-x-2">
              {'user1@retroteam.ai' === comment.author && (
                <div className="w-[2px] h-[34px] bg-orange-300"></div>
              )}
              <Paragraph
                description={description}
                onDoubleClickEvent={onDoubleClickEvent}
              />
              <If
                condition={(isAllowedToDelete || isAllowedToUpdate) && isAction}
              >
                <div className="w-auto relative cursor-pointer flex justify-end">
                  <button
                    className="flex w-h w-6"
                    onClick={() => setShowMenu(!showMenu)}
                  >
                    <Image className="ml-auto" src={vector} alt="menu vector" />
                  </button>
                  {showMenu && (
                    <div
                      ref={cardRef}
                      className="absolute space-y-2 rounded-md  w-max py-1.5 px-2 right-2 top-0  z-50 bg-white border shadow-md"
                    >
                      {isAllowedToUpdate && (
                        <button
                          className="flex space-x-2"
                          onClick={() => {
                            setEditCard(comment.id);
                            setEditMode(true);
                          }}
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
              </If>
            </div>
            <div className="mt-6 flex w-full justify-between space-x-6 items-center">
              <If condition={showAuthors}>
                <div
                  className="flex w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {isAllowedToUpdate ? (
                    <>
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
                      <ProfileAvatar selectedMember={comment.assignee} />
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
              {(isAllowedToDelete || isAllowedToUpdate) && !isAction && (
                <div className="w-full relative cursor-pointer flex justify-end">
                  <button
                    className="flex w-h w-6"
                    onClick={() => setShowMenu(!showMenu)}
                  >
                    <Image className="ml-auto" src={vector} alt="menu vector" />
                  </button>
                  {showMenu && (
                    <div
                      ref={cardRef}
                      className="absolute space-y-2 rounded-md py-1.5 px-2 right-2 top-0  z-50 bg-white border shadow-md"
                    >
                      {isAllowedToUpdate && (
                        <button
                          className="flex space-x-2"
                          onClick={() => {
                            setEditCard(comment.id);
                            setEditMode(true);
                          }}
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
              )}
              {isAction && (
                <div className="w-full cursor-pointer flex justify-end">
                  <button className="flex  w-h w-6">
                    <div className="bg-orange-500 w-full text-white rounded-full ">
                      {comment.votes}
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </TooltipTrigger>
        {!active && isAllowedToUpdate && !isAction && (
          <TooltipContent side="bottom">Double click to edit</TooltipContent>
        )}
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
    </Tooltip>
  );
}
export default TaskCard;
