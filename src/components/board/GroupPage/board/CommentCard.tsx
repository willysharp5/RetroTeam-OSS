import { useState, useEffect, useRef, Fragment } from 'react';
import toaster from 'react-hot-toast';

import Image from 'next/image';

import edit from 'public/assets/svg/edit-3.svg';
import unlink from 'public/assets/svg/unlink.svg';
import close from 'public/assets/svg/close.svg';
import trash from 'public/assets/svg/trash.svg';
import update from 'public/assets/svg/update.svg';
import x from '/public/assets/svg/x.svg';

import ContextMenu from '~/components/shared/contextMenu';
import UserImage from '~/components/dashboard/UserImage';
import BoardAsigneeSelector from '../../BoardAssigneeSelector';

import useUpdateComments from '~/lib/board/hooks/use-update-comments';
import useDeleteComments from '~/lib/board/hooks/use-delete-comment';
import useDetatchComments from '~/lib/board/hooks/use-detatch-comment';
import { Comment } from '~/lib/board/types/types';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import { Rules } from '~/lib/rules/types';

import If from '~/core/ui/If';
import DeleteModal from '~/components/shared/deleteModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/core/ui/Tooltip';
import { boardPermissions } from '~/components/utils/boardPermissions';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

interface CommentCardProps {
  comment: Comment;
  organizationId: string;
  retrospective: Retrospectives;
  currentUser: any;
  teamId: string;
  deleteTask: (id: string) => void;
  detatchTask: (id: Comment) => void;
  DetatchAllComments: (id: Comment) => void;
  updateTask: (id: string, content: Comment) => void;
  retrospectiveId: string;
  groupId: string;
  rules: Rules;
  editCard: string;
  setEditCard: (card: any) => void;
  currentUserRole: number;
}

const CommentCard = ({
  comment,
  organizationId,
  retrospective,
  currentUser,
  teamId,
  deleteTask,
  detatchTask,
  DetatchAllComments,
  updateTask,
  retrospectiveId,
  groupId,
  rules,
  editCard,
  setEditCard,
  currentUserRole,
}: CommentCardProps) => {
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [description, setDescription] = useState(comment?.description);
  const [selectedMember, setSelectedMember] = useState(comment?.assignee);

  const { trigger: UpdateComments } = useUpdateComments();
  const { trigger: DeleteComment } = useDeleteComments(
    organizationId,
    retrospective.id,
    comment?.id,
  );
  const { trigger: detatchComment } = useDetatchComments(
    organizationId,
    retrospective.id,
    comment?.id,
    groupId,
  );

  const [name, setName] = useState('Anonymous');

  const [isAllowedToUpdate, setIsAllowedToUpdate] = useState(false);
  const [isAllowedToDelete, setIsAllowedToDelete] = useState(false);

  useEffect(() => {
    if (retrospective && rules) {
      const permissions = boardPermissions(
        retrospective,
        rules,
        currentUserRole,
        comment,
        currentUser.uid,
        currentUser.isAnonymous || !currentUser.email,
        false
      );
      setIsAllowedToUpdate(permissions.isAllowedToUpdate);
      setIsAllowedToDelete(permissions.isAllowedToDelete);
    }
  }, [retrospective, rules, currentUserRole]);

  useEffect(() => {
    setDescription(comment.description);
    setSelectedMember(comment.assignee);
  }, [comment.description, comment.assignee]);

  useEffect(() => {
    if (comment.assignee !== '' && comment.assignee !== 'anonymous') {
      const name = comment.user.name + ' ' + comment.user.lastName;
      setName(name);
    } else {
      setName('Anonymous');
    }
  }, [comment]);

  const showDeleteModalHandler = () => {
    setShowDeleteModal(true);
  };

  const closeDeleteModalHandler = () => {
    setShowDeleteModal(false);
  };

  const UpdateComment = async () => {
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
      voters: comment.voters,
    };
    const promise = UpdateComments(body)
      .then((res: any) => {
        if (res.success) {
          updateTask(comment.id, res.data);
          setEditCard('');
        }
      })
      .catch((e) => {
        console.log('ERROR UpdateComments', e);
      });
    await toaster.promise(promise, {
      loading: 'Updating comment',
      success: 'Comment has been updated',
      error: 'Error updating comment',
    });
  };

  const UpdateGroupComment = async () => {
    const body = {
      id: comment.id,
      description: comment.description,
      assignee: comment.assignee,
      organization: organizationId,
      teamId,
      retrospectiveId,
      status: comment.status,
      order: comment.order,
      group: '',
      votes: 0,
      voters: [],
    };
    UpdateComments(body)
      .then((res: any) => {
        if (res.success) {
          DetatchComments();
        }
      })
      .catch((e) => {
        console.log('ERROR UpdateComments', e);
      });
  };

  const DeleteComments = async () => {
    const promise = DeleteComment()
      .then(() => {
        if (comment?.id !== undefined) {
          detatchTask(comment);
          deleteTask(comment.id);
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

  const DetatchComments = async () => {
    const promise = detatchComment()
      .then((res: any) => {
        if (res.success) {
          detatchTask(comment);
        }
      })
      .catch((e) => {
        console.log('ERROR DetatchComments', e);
      });

    await toaster.promise(promise, {
      loading: 'Deatching comment',
      success: 'Comment has been detatched',
      error: 'Error detatching comment',
    });
  };

  const menuOptions = [
    {
      name: 'Detach all',
      action: DetatchAllComments,
      icon: unlink,
    },
    {
      name: 'Detach card',
      action: UpdateGroupComment,
      icon: unlink,
    },
  ];

  if (isAllowedToDelete) {
    menuOptions.unshift({
      name: 'Delete',
      action: showDeleteModalHandler,
      icon: trash,
    });
  }

  if (isAllowedToUpdate) {
    menuOptions.unshift({
      name: 'Edit',
      action: () => setEditCard(comment.id),
      icon: edit,
    });
  }

  const menuOptions2 = [
    {
      name: 'Detach all',
      action: DetatchAllComments,
      icon: unlink,
    },
    {
      name: 'Detach card',
      action: UpdateGroupComment,
      icon: unlink,
    },
  ];

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'Enter' && textAreaRef.current) {
        e.preventDefault();
        const textarea = textAreaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        if (start !== null && end !== null) {
          const prevDescription = textarea.value;
          const newDescription =
            prevDescription.substring(0, start) +
            '\n' +
            prevDescription.substring(end);
          setDescription(newDescription);
          textarea.value = newDescription;
        }
      }
    };

    if (textAreaRef.current) {
      textAreaRef.current.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (textAreaRef.current) {
        textAreaRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  if (editCard === comment.id) {
    return (
      <>
        <div className="mt-8 pt-4 border-t">
          <div className=" relative">
            <div
              className=" bg-white p-3 border rounded-md shadow-sm"
              onDoubleClick={() => {
                if (isAllowedToUpdate) setEditCard(false);
              }}
            >
              <div className="my-2 flex w-full justify-end">
                <button onClick={() => setEditCard('')}>
                  <Image
                    className="m-auto"
                    width={20}
                    height={20}
                    src={x}
                    alt="close"
                  ></Image>
                </button>
              </div>

              <div className="flex justify-between w-full">
                <div className="flex justify-between w-full">
                  <div className="relative w-full">
                    <textarea
                      className={`${'min-h-[150px]'}  w-full border border-gray-300 py-2 px-3 rounded focus:outline-none text-base`}
                      id="review-text"
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={'Enter your action description'}
                      ref={textAreaRef}
                      rows={1}
                      value={description}
                      disabled={false}
                    ></textarea>
                    <label
                      htmlFor="review-text"
                      className={`text-xs text-center ${'bg-white'} absolute bottom-2 left-0 mr-4 ml-1 right-3 text-red-500 pointer-events-none`}
                      style={{ zIndex: 5 }}
                    >
                      <b>Return</b>&nbsp;to enter new line
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex w-full space-x-2">
                {retrospective.authors && (
                  <div className="flex w-full">
                    {isAllowedToUpdate ? (
                      <BoardAsigneeSelector
                        selectedMember={selectedMember}
                        setSelectedMember={setSelectedMember}
                        organizationId={organizationId}
                        name={comment.user.fullName}
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
                          <p className="truncate">{name}</p>
                        </div>
                      </div>
                    )}
                    {selectedMember != '' && isAllowedToUpdate && (
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
                    )}
                  </div>
                )}
              </div>
              {isAllowedToUpdate && (
                <button
                  onClick={() => {
                    UpdateComment();
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
      </>
    );
  }

  return (
    <div className="space-y-2.5 border-t pt-5  mt-8">
      <div className="flex justify-between w-full space-x-2">
        <If condition={comment.author === currentUser.uid}>
          <div className="w-[2px] h-[34px] bg-orange-300"></div>
        </If>
        <Paragraph
          description={comment.description}
          onDoubleClickEvent={() => {
            if (isAllowedToUpdate) setEditCard(comment.id);
          }}
        />
        <If condition={!retrospective.authors}>
          <div className="cursor-pointer flex justify-end">
            <ContextMenu
              mainClassName={
                'relative right-4 px-3 py-1 flex justify-center z-0'
              }
              className={
                'absolute w-max space-y-2 rounded-md py-1.5 px-2 bottom-6 right-5 z-50 bg-white border shadow-md text-black'
              }
              options={
                comment.author === currentUser.uid ||
                currentUserRole === MembershipRole.Facilitator
                  ? menuOptions
                  : menuOptions2
              }
            ></ContextMenu>
          </div>
        </If>
      </div>

      <div className="flex justify-between items-center">
        <If condition={retrospective.authors}>
          <div className="flex flex-auto items-center space-x-4">
            <UserImage
              organizationId={organizationId}
              selectedMember={comment?.assignee}
            />
            <div className="flex-1 min-w-0 text-xs">
              <p className="truncate text-sm">{name}</p>
            </div>
          </div>
          <div className="w-full cursor-pointer flex justify-end">
            <ContextMenu
              mainClassName={
                'relative right-4 px-3 py-1 flex justify-center z-0'
              }
              className={
                'absolute w-max space-y-2 rounded-md py-1.5 px-2 bottom-6 right-5 z-50 bg-white border shadow-md text-black'
              }
              options={
                comment.author === currentUser.uid ||
                currentUserRole === MembershipRole.Facilitator
                  ? menuOptions
                  : menuOptions2
              }
            ></ContextMenu>
          </div>
        </If>
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
    </div>
  );
};

interface ParagraphProps {
  description: string;
  onDoubleClickEvent: () => void;
}

function Paragraph({ description, onDoubleClickEvent }: ParagraphProps) {
  const contentRef = useRef(null);

  const [hasOverflow, setHasOverflow] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  const handleClick = () => {
    setShowFullText(!showFullText);
  };

  useEffect(() => {
    if (contentRef.current) {
      const { clientHeight, scrollHeight } = contentRef.current;
      if (scrollHeight > clientHeight) {
        setHasOverflow(true);
      }
    }
  });

  return (
    <Tooltip>
      <TooltipTrigger className="w-full relative">
        <div className="text-left">
          <p
            ref={contentRef}
            onDoubleClick={onDoubleClickEvent}
            className="text-[#71717A] text-sm overflow-hidden flex-grow flex-shrink my-auto w-full cursor-pointer overflow-hidden"
            style={
              showFullText
                ? {
                    display: '-webkit-box',
                    WebkitLineClamp: 'unset',
                    WebkitBoxOrient: 'vertical',
                    overflowWrap: 'anywhere',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }
                : {
                    textOverflow: 'ellipsis',
                    WebkitLineClamp: 2,
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    overflowWrap: 'anywhere',
                    whiteSpace: 'pre-wrap',
                  }
            }
            onClick={handleClick}
          >
            {description.split('\n').map((line: string, index: number) => (
              <Fragment key={index}>
                {line}
                <br />
              </Fragment>
            ))}
          </p>{' '}
        </div>
      </TooltipTrigger>
      {!showFullText && hasOverflow && (
        <TooltipContent side="top">Click to expand text</TooltipContent>
      )}
    </Tooltip>
  );
}

export default CommentCard;
