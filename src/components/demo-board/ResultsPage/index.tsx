import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import toaster from 'react-hot-toast';
import Image from 'next/image';

import { useRouter } from 'next/router';

import ReactToPrint from 'react-to-print';

import ResultsHeader from '~/components/layouts/sidebar/ResultsHeader';
import { SectionTitleBar } from '~/components/utils/SectionTitleBar';

import { showFullDate } from '~/components/utils/dateformatter';

import { TeamMembers } from '~/lib/teams/types/teams';

import RetroTeamLogo from 'public/assets/svg/LogoText.svg';
import download from 'public/assets/svg/download.svg';
import users from 'public/assets/svg/users-results.svg';
import chat from 'public/assets/svg/chat-bubble.svg';
import thumbs from 'public/assets/svg/thumbs-up.svg';
import caret from 'public/assets/svg/caret-left-white.svg';

import { BoardColumn, Comment, Group } from '~/lib/board/types/types';
import { Task } from '~/lib/actions/types/actions';

import If from '~/core/ui/If';

import brain from 'public/assets/svg/brain-circuit.svg';
import { Avatar, AvatarFallback } from '~/core/ui/Avatar';
import { useGetDemoRetrospective } from '~/lib/server/demo/get-demo-retrospective';
import useFetchDemoComments from '~/lib/server/demo/get-demo-comments';
import useFetchDemoGroups from '~/lib/server/demo/get-demo-groups';
import useFetchDemoActions from '~/lib/server/demo/get-demo-actions';

const ProfileAvatar: React.FC<{ selectedMember: string }> = ({
  selectedMember,
}) => {
  return selectedMember !== '' ? (
    <Avatar>
      <AvatarFallback>U</AvatarFallback>
    </Avatar>
  ) : (
    <div>
      <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full">
        <span className="flex h-full w-full items-center justify-center rounded-full bg-gray-300 font-semibold uppercase text-white"></span>
      </span>
    </div>
  );
};

interface Participant {
  selectedMember: string;
  role?: string;
}
export function Participant({ selectedMember, role }: Participant) {
  return (
    <div className="flex items-center space-x-2 py-4">
      <ProfileAvatar selectedMember={selectedMember} />
      <div className="flex flex-col">
        <span className="text-zinc-900 text-sm font-medium">
          {selectedMember}
        </span>
        {role && (
          <span className="text-zinc-500 text-sm font-normal">{role}</span>
        )}
      </div>
    </div>
  );
}

export function InfoContainer({
  children,
  hasHeader,
}: {
  children?: React.ReactNode;
  hasHeader: boolean;
}) {
  return (
    <div
      className={`relative border rounded-md border-zinc-200 p-6 bg-white ${
        hasHeader && 'md:min-w-[700px]'
      } `}
    >
      {children}
    </div>
  );
}

interface BaseInfo {
  image: string;
  children?: React.ReactNode;
  bgColor?: string;
}

function BaseInfo({ image, children, bgColor = 'white' }: BaseInfo) {
  return (
    <div
      className={`flex justify-center items-center bg-${bgColor} h-8 px-3 py-2 text-sm text-zinc-950 font-medium rounded-md`}
    >
      <Image className="mr-2" src={image} alt="" />
      {children}
    </div>
  );
}

function UsersInfo({ children }: { children?: React.ReactNode }) {
  return <BaseInfo image={users}>{children}</BaseInfo>;
}

function CommentsInfo({ children }: { children?: React.ReactNode }) {
  return <BaseInfo image={chat}>{children}</BaseInfo>;
}

function VotesInfo({ children }: { children?: React.ReactNode }) {
  return (
    <BaseInfo image={thumbs} bgColor="zinc-100">
      {children}
    </BaseInfo>
  );
}

function Notification({ vote }: { vote: number }) {
  return (
    <div className="flex justify-center items-center bg-orange-500 text-white rounded-full h-6 w-6 text-xs">
      {vote}
    </div>
  );
}

interface CommentsProps {
  comment: Comment;
  votes?: number;
  canShowAuthors: boolean;
}

function Comments({ comment, votes, canShowAuthors }: CommentsProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <span className="text-zinc-500 text-sm">{comment?.description}</span>
        <If condition={canShowAuthors}>
          <Participant
            selectedMember={
              comment?.assignee !== '' ? comment?.assignee : 'Anonymous'
            }
          />
        </If>
      </div>
      {votes && <Notification vote={votes} />}
    </div>
  );
}

function Badge({ children }: { children?: React.ReactNode }) {
  return (
    <div className="inline border p-1 m-0.5 rounded text-xs">{children}</div>
  );
}

function Separator() {
  return <div className="border-b border-zinc-200 w-full"></div>;
}

interface ResultsProps {
  hasHeader: boolean;
  printRef: any;
  showAuthorsProps?: boolean;
}
export default function ResultsDemo({
  hasHeader,
  printRef,
  showAuthorsProps = true,
}: ResultsProps) {
  const userId = 'user1@retroteam.ai';

  const router = useRouter();

  const {
    retrospective,
  } = useGetDemoRetrospective();

  const {
    data,
    loading: loadingComments,
    allComments,
  } = useFetchDemoComments(true, userId, 1);

  const { data: groupData, loading: loadingGroups } = useFetchDemoGroups(
    true,
    1,
  );
  const { data: actionsData } = useFetchDemoActions();

  const [activeMembers, setActiveMembers] = useState<
    TeamMembers[] | undefined
  >();

  const [comments, setComments] = useState<Comment[] | any>(data);
  const [groups, setGroups] = useState<Group[] | any>(groupData);
  const [actions, setActions] = useState<Task[] | any>(actionsData);

  const [patternsAI, setPatternsAI] = useState([]);

  useEffect(() => {
    if (allComments && retrospective) {
      if (retrospective.aiInsigths) {
        setPatternsAI(retrospective?.aiInsigths[0]);
      }
      const _members = Object.values(retrospective.members) as any;
      setActiveMembers(_members);
    }
  }, [allComments, retrospective]);

  useEffect(() => {
    if (data) {
      setComments(data);
    }
  }, [data]);

  useEffect(() => {
    if (groupData) {
      setGroups(groupData);
    }
  }, [groupData]);

  useEffect(() => {
    if (actionsData) {
      setActions(actionsData);
    }
  }, [actionsData]);

  const reactToPrintTrigger: any = useCallback(() => {
    return (
      <button
        className={`flex justify-center items-center bg-orange-500 hover:bg-orange-400 text-white py-2 px-4 rounded-md print:hidden ${
          !hasHeader && 'w-[190px]'
        }`}
      >
        <Image className="mr-2" src={download} alt="" />
        <span> Export to PDF</span>
      </button>
    );
  }, [hasHeader]);

  const reactToPrintContent = useCallback(() => {
    return printRef.current;
  }, [printRef]);

  const formatComments = (comment: any) => {
    const reasonStart = comment.indexOf('(Reason:');
    if (reasonStart !== -1) {
      const beforeReason = comment.substring(0, reasonStart).trim();
      const reasonText = comment
        .substring(reasonStart + '(Reason:'.length)
        .trim()
        .replace(')', '');
      return (
        <li className="text-[#71717A]">
          {beforeReason}
          <ul className="list-disc pl-5">
            <li>Reason: {reasonText}</li>
          </ul>
        </li>
      );
    }
    return <li className="text-[#71717A]">{comment}</li>;
  };

  const [showAuthors, setShowAuthors] = useState(true);

  useEffect(() => {
    setShowAuthors(showAuthorsProps);
  }, [showAuthorsProps]);

  return (
    <div id="results" className='bg-white' ref={printRef}>
      <If condition={hasHeader}>
        <div className="print:hidden">
          <ResultsHeader />
        </div>
      </If>
      <div className="flex justify-center">
        <div
          className={`flex flex-col justify-center w-full max-w-3xl ${
            hasHeader ? 'space-y-16 mt-6' : 'space-y-4'
          }`}
        >
          <div className={`${!hasHeader && 'hidden print:block'}`}>
            <div>
              <Image
                className={`h-10 w-auto hidden print:block ${
                  !hasHeader && 'print:mt-5'
                }`}
                src={RetroTeamLogo}
                alt=""
              />
            </div>
            <div
              className={`flex flex-col justify-center space-y-2 ${
                hasHeader ? 'items-center text-center' : 'text-left'
              }`}
            >
              <h1 className="print:m-auto text-2xl font-black">
                {retrospective?.name}
              </h1>
              <span className="print:m-auto text-sm text-zinc-500">
                {retrospective?.title} -{' '}
                {retrospective?.date &&
                  showFullDate(retrospective.date.toDate())}
              </span>
              <div className="flex space-x-2">
                {hasHeader && (
                  <button
                    onClick={() => {
                      router.push("/demo");
                    }}
                    className="flex justify-center items-center bg-black hover:bg-gray-500 text-white py-2 px-4 rounded-md print:hidden"
                  >
                    <Image className="mr-2" src={caret} alt="" />
                    <span> Back to retrospective</span>
                  </button>
                )}
                <ReactToPrint
                  content={reactToPrintContent}
                  documentTitle={retrospective?.title}
                  trigger={reactToPrintTrigger}
                />
                <div className="print:hidden flex items-center space-x-1 text-sm justify-between">
                  <p>Show author of comments</p>
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          console.log('chec');
                          setShowAuthors(!showAuthors);
                        }}
                        checked={showAuthors}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`space-y-6 ${!hasHeader && 'border rounded-md p-6'} `}
          >
            <SectionTitleBar title="Participants">
              <UsersInfo>{activeMembers && activeMembers.length}</UsersInfo>
            </SectionTitleBar>
            <InfoContainer hasHeader={hasHeader}>
              <div className="mb-6">
                <span className="text-zinc-500 text-sm">
                  Facilitators and Members who participated in this
                  retrospective
                </span>
              </div>
              <div
                id="participants"
                className="grid md:grid-cols-3 gap-y-4 max-h-[251px] overflow-y-auto print:overflow-visible print:max-h-full print:grid-cols-3"
              >
                {activeMembers &&
                  activeMembers
                    .slice(0, activeMembers.length > 6 ? 5 : 6)
                    .map((member, index) => (
                      <Participant
                        key={`${index} ${member.email}`}
                        selectedMember={member.email}
                        role={member.role > 0 ? 'Facilitator' : 'Member'}
                      />
                    ))}
                {activeMembers && activeMembers?.length > 6 && (
                  <div className="flex items-center space-x-2 py-4">
                    <div className="bg-[#EF444480] flex justify-center rounded-full h-8 w-8  ">
                      <p className="font-normal">.....</p>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-zinc-900 text-sm">
                        {activeMembers.length - 5} more
                      </span>
                      <span className="text-zinc-500 text-sm font-normal">
                        Participants
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </InfoContainer>
            <Fragment></Fragment>
            <SectionTitleBar
              title="Ai Insights - Patterns / Actions"
              color={'purple-100'}
            >
              <BaseInfo image={brain} />
            </SectionTitleBar>
            <div className="border rounded-lg p-8 space-y-6">
              {patternsAI &&
                Object.entries(patternsAI as any)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([title, comments], index) => (
                    <div key={'pattern AI' + index}>
                      <p className="text-lg font-semibold">{title}</p>
                      <ul className="list-disc">
                        {(Array.isArray(comments) as any) ? (
                          (comments as any[]).map(
                            (comment: any, commentIndex: number) => (
                              <Fragment key={'AI comment' + commentIndex}>
                                {formatComments(comment)}
                              </Fragment>
                            ),
                          )
                        ) : (
                          <li>No comments available</li>
                        )}
                      </ul>
                    </div>
                  ))}
            </div>
            {actions && actions.length > 0 && (
              <Fragment key={'Action'}>
                <SectionTitleBar title="Action" color="blue-100">
                  <CommentsInfo>{actions.length}</CommentsInfo>
                </SectionTitleBar>

                {actions &&
                  actions.map((item: Comment, index: number) => (
                    <InfoContainer
                      hasHeader={hasHeader}
                      key={'InfoContainer' + index}
                    >
                      <Comments
                        key={'Comment' + index}
                        comment={item}
                        canShowAuthors={showAuthors}
                      />
                    </InfoContainer>
                  ))}
              </Fragment>
            )}

            {retrospective &&
              retrospective.structure.map(
                (column: BoardColumn, index: number) => {
                  const totalComments =
                    comments
                      ?.filter(
                        (comment: Comment) => comment.status === column.id,
                      )
                      .reduce((accumulator: number) => accumulator + 1, 0) || 0;

                  const totalGroups =
                    groups
                      ?.filter((group: Group) => group.status === column.id)
                      .reduce((accumulator: number) => accumulator + 1, 0) || 0;

                  const totalCommentVotes =
                    comments
                      ?.filter(
                        (comment: Comment) => comment.status === column.id,
                      )
                      .reduce(
                        (accumulator: number, item: Comment) =>
                          accumulator + item.votes,
                        0,
                      ) || 0;

                  const totalGroupVotes =
                    groups
                      ?.filter((group: Group) => group.status === column.id)
                      .reduce(
                        (accumulator: number, item: Group) =>
                          accumulator + item.votes,
                        0,
                      ) || 0;

                  const filterComments = comments?.filter(
                    (comment: Comment) => comment.status === column.id,
                  );

                  const filterGroups = groups?.filter(
                    (group: Group) => group.status === column.id,
                  );

                  return (
                    <Fragment key={'Column' + index}>
                      <SectionTitleBar title={column.name} color="red-50">
                        <CommentsInfo>
                          {totalComments + totalGroups}
                        </CommentsInfo>
                        <VotesInfo>
                          {totalCommentVotes + totalGroupVotes}
                        </VotesInfo>
                      </SectionTitleBar>

                      {filterComments?.length > 0 &&
                        filterComments.map((item: Comment, index: number) => (
                          <InfoContainer
                            hasHeader={hasHeader}
                            key={'InfoContainer2' + index}
                          >
                            <Comments
                              key={'Comment' + index}
                              comment={item}
                              votes={item.votes}
                              canShowAuthors={showAuthors}
                            />
                          </InfoContainer>
                        ))}

                      {filterGroups?.length > 0 &&
                        filterGroups.map((item: Group, index: number) => (
                          <InfoContainer
                            hasHeader={hasHeader}
                            key={'InfoContainer group' + index}
                          >
                            <div className="flex items-center w-full justify-between text-sm text-zinc-500">
                              <div className="text-zinc-900 font-semibold">
                                {item.name}
                              </div>
                              <div className="flex flex-col items-center justify-center space-y-2 my-2">
                                {item.comments.length} comments
                                <Notification vote={item.votes} />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <Separator />
                              {item.comments &&
                                item.comments.map((comment, index) => (
                                  <Fragment key={'Group' + index}>
                                    <Comments
                                      comment={comment}
                                      canShowAuthors={showAuthors}
                                    />
                                    <Separator />
                                  </Fragment>
                                ))}
                            </div>
                            <div className="my-4">
                              {item?.tags?.map((tag, index) => (
                                <Badge key={'Badge' + index}>{tag.name}</Badge>
                              ))}
                            </div>
                          </InfoContainer>
                        ))}
                      <If
                        condition={
                          filterComments?.length === 0 &&
                          filterGroups?.length === 0
                        }
                      >
                        <InfoContainer
                          hasHeader={hasHeader}
                          key={'InfoContainer2' + index}
                        >
                          <p className="text-center">No card</p>
                        </InfoContainer>{' '}
                      </If>
                    </Fragment>
                  );
                },
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
