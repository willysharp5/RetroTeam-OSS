import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import toaster from 'react-hot-toast';
import Image from 'next/image';

import { useRouter } from 'next/router';

import ReactToPrint from 'react-to-print';

import ResultsHeader from '../layouts/sidebar/ResultsHeader';
import { SectionTitleBar } from '../utils/SectionTitleBar';
import WordCounterErrorModal from '../shared/wordCountErrorModal';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { useGetBoardByRetrospectiveId } from '~/lib/board/hooks/use-get-board-by-retrospective';

import { showFullDate } from '../utils/dateformatter';

import { TeamMembers } from '~/lib/teams/types/teams';

import RetroTeamLogo from 'public/assets/svg/LogoText.svg';
import download from 'public/assets/svg/download.svg';
import users from 'public/assets/svg/users-results.svg';
import chat from 'public/assets/svg/chat-bubble.svg';
import thumbs from 'public/assets/svg/thumbs-up.svg';
import caret from 'public/assets/svg/caret-left-white.svg';

import UserImage from '../dashboard/UserImage';
import { BoardColumn, Comment, Group } from '~/lib/board/types/types';
import useFetchComments from '~/lib/server/board/get-comments';
import useFetchGroups from '~/lib/server/board/get-groups';
import useFetchActions from '~/lib/server/board/get-actions';
import { Task } from '~/lib/actions/types/actions';

import If from '~/core/ui/If';

import brain from 'public/assets/svg/brain-circuit.svg';
import LoadingMembersSpinner from '../organizations/LoadingMembersSpinner';
import { useAddAIToRetrospective } from '~/lib/retrospectives/hooks/use-add-ai-to-retrospective';
import useFetchRules from '~/lib/server/rules/get-rules';

import { useAuth } from 'reactfire';
import { useCurrentSubscriptionById } from '~/lib/entitlements/hooks/use-entitlements';
import RegenerateAiButton from '../shared/regenerateAiButton';
import AiNotConfiguredNotice from '../shared/AiNotConfiguredNotice';
import { useGetOrganizationById } from '~/lib/organizations/hooks/use-get-organization-by-id';

import { MembershipRole } from '~/lib/organizations/types/membership-role';
import { useUpdateStatusBoardMember } from '~/lib/board/hooks/use-update-status-members';
import { useUpdateBoardSettings } from '~/lib/board/hooks/use-update-show-authors';
import useGetPatternsAdvice from '~/lib/ai/use-get-patterns-advice';

interface Participant {
  name?: string;
  role?: string;
  avatar?: string;
  organizationId: string;
  userId: string;
}
export function Participant({
  name,
  role,
  organizationId,
  userId,
}: Participant) {
  return (
    <div className="flex items-center space-x-2 py-4">
      {organizationId && (
        <UserImage organizationId={organizationId} selectedMember={userId} />
      )}
      <div className="flex flex-col">
        <span className="text-zinc-900 text-sm font-medium">{name}</span>
        <span className="text-zinc-500 text-sm font-normal">{role}</span>
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
  participant: any;
  votes?: number;
  organizationId: string;
  userId: string;
  canShowAuthors: boolean;
}

function Comments({
  comment,
  participant,
  votes,
  organizationId,
  userId,
  canShowAuthors,
}: CommentsProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <span className="text-zinc-500 text-sm">{comment?.description}</span>
        <If condition={canShowAuthors}>
          <Participant
            name={
              comment?.assignee !== '' ? participant?.fullName : 'Anonymous'
            }
            organizationId={organizationId}
            userId={userId}
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
}
export default function Results({ hasHeader, printRef }: ResultsProps) {
  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;
  const subscriptionId = organization?.subscription?.priceId;

  const { organization: organizationData } =
    useGetOrganizationById(organizationId);

  const auth = useAuth();
  const user = auth.currentUser;

  const router = useRouter();
  const { id } = router.query;
  const retrospectiveId = id?.toString().split('#')[0] || '';

  const { retrospective, members: _members } = useGetBoardByRetrospectiveId(
    organizationId,
    retrospectiveId,
  );

  const teamId = retrospective?.teamId as string;
  const {
    data,
    allComments,
    loading: loadingComments,
  } = useFetchComments(organizationId, teamId, retrospectiveId, true, 1, '', 2);

  const { data: groupData, loading: loadingGroups } = useFetchGroups(
    organizationId,
    teamId,
    retrospectiveId,
    true,
    1,
    2,
  );

  const { data: actionsData } = useFetchActions(
    organizationId,
    teamId,
    retrospectiveId,
  );

  const [activeMembers, setActiveMembers] = useState<TeamMembers[] | undefined>(
    _members,
  );

  const [comments, setComments] = useState<Comment[] | any>(data);
  const [groups, setGroups] = useState<Group[] | any>(groupData);
  const [actions, setActions] = useState<Task[] | any>(actionsData);

  const [patternsAI, setPatternsAI] = useState([]);

  const [hasUsedAI, setHasUsedAI] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  const [errorAI, setErrorAI] = useState('');
  const [showAiWordError, setShowAiWordError] = useState(false);

  const aiCanceled = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentUserRole, setCurrentUserRole] = useState(0);

  const addAIToRetrospective = useAddAIToRetrospective();

  const onAddAIToRetrospective = useCallback(
    (aiContent: any) => {
      void (async () => {
        try {
          if (aiCanceled.current) return;
          addAIToRetrospective(
            organizationId,
            retrospectiveId,
            'ai-insights',
            aiContent,
          );
        } catch (e) {
          console.error('Error onAddAIToRetrospective ' + e);
        }
      })();
    },
    [addAIToRetrospective, organizationId, retrospectiveId],
  );

  const { trigger: getPatternsAdviceFromAI } = useGetPatternsAdvice();

  async function getPatternsAdviceAI() {
    if (allComments) {
      if (allComments.length > 0 && currentUserRole === MembershipRole.Admin) {
        setErrorAI('');
        if (aiCanceled.current) return;
        setLoadingAI(true);

        // Set a timeout to cancel the AI action after 5 minutes (300000 ms)
        timeoutRef.current = setTimeout(() => {
          aiCanceled.current = true;
          setLoadingAI(false);
          console.error('AI action timed out');
        }, 300000);

        try {
          const r: any = await getPatternsAdviceFromAI({
            comments: allComments,
            retrospective,
            totalAiTokens: rules.totalAiTokens,
          });
          const response = r.data;

          if (aiCanceled.current) return;

          if (r.error) {
            if (
              r.error.message === 'This data is too large for our AI to Analyze'
            ) {
              setShowAiWordError(true);
            }
          }

          if (
            Array.isArray(response) &&
            response.length > 0 &&
            response.every((item) => item === undefined)
          ) {
            console.error('Response is [undefined]');
            return;
          }

          // Proceed with processing the response if it's valid
          const flattenedData = response.flat();

          if (aiCanceled.current) return;
          setPatternsAI(flattenedData[0]);
          onAddAIToRetrospective(flattenedData);
          setHasUsedAI(true);
          setLoadingAI(false);
        } catch (error) {
          console.error('Error fetching AI patterns:', error);
          // Handle error as needed
        } finally {
          // Clear the timeout if the request completes before the timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          // Ensure loading state is reset if there's no further action
          if (!aiCanceled.current) {
            setLoadingAI(false);
          }
        }
      } else {
        setErrorAI('No Insights');
        setLoadingAI(false);
      }
    }
  }

  const onCancelAI = () => {
    setLoadingAI(false);
    aiCanceled.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
  const { data: rules } = useFetchRules('ai');

  const [canUseAI, setCanUseAI] = useState(false);

  useEffect(() => {
    if (rules) {
      setCanUseAI(rules.useAI);
    }
  }, [rules]);

  const [restrictions, setRestrictions] = useState<any>();

  // This open-source build has no usage limits, so AI actions are never
  // rationed. Kept as a value rather than deleted so the (inert) prop chain
  // down to the board components stays intact.
  const aiRemaining = Number.POSITIVE_INFINITY;

  const { product } = useCurrentSubscriptionById(
    subscriptionId,
    organization?.subscription?.status,
  );

  useEffect(() => {
    setRestrictions(product);
  }, [product]);

  useEffect(() => {
    if (allComments && retrospective && !hasUsedAI) {
      if (!retrospective.aiInsigths && aiRemaining > 0) {
        getPatternsAdviceAI();
      } else {
        setErrorAI('');
        if (retrospective.aiInsigths) {
          setPatternsAI(retrospective?.aiInsigths[0]);
        }

        setLoadingAI(false);
      }
    }
  }, [allComments, retrospective, hasUsedAI]);

  useEffect(() => {
    const active = _members.filter(
      (member: TeamMembers) => member.active === true,
    );
    setActiveMembers(active);
    if (_members.length > 0) {
      const active = _members.filter(
        (member: TeamMembers) => member.active === true,
      );
      setActiveMembers(active);

      const currentUser = _members.find(
        (item: any) => item.userId === user?.uid,
      );

      setCurrentUserRole(currentUser.role);
    }
  }, [_members]);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = window.location.href;
    const isFromEmail = /#email/.test(url);

    if (
      retrospective?.href &&
      retrospectiveId &&
      !isFromEmail &&
      retrospective.href !== `/results/${retrospectiveId}` &&
      router.asPath !== retrospective.href
    ) {
      router.replace(retrospective.href as string);
    }
  }, [retrospective, retrospectiveId, router]);

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

  const updateMemberStatus = useUpdateStatusBoardMember();

  const onUpdateRoleMemberRequested = useCallback(
    (type: string, value: any) => {
      void (async () => {
        try {
          updateMemberStatus(
            organizationId,
            teamId,
            retrospectiveId,
            user?.uid as string,
            type,
            value,
          );
        } catch (e) {
          console.error(e);
        }
      })();
    },
    [updateMemberStatus, organizationId, retrospectiveId, teamId, user],
  );

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
    if (retrospective) {
      setShowAuthors(retrospective.authors);
    }
  }, [retrospective]);

  const updateBoardSettings = useUpdateBoardSettings();

  const onUpdateBoardSettings = useCallback(
    (type: string, value: any, from: string) => {
      void (async () => {
        try {
          const promise = updateBoardSettings(
            organizationId,
            retrospectiveId,
            type,
            value,
          );

          if (type === 'authors') {
            if (value) {
              await toaster.promise(promise, {
                loading: 'Updating settings',
                success: 'Show author comments',
                error: 'Error updating settings',
              });
            } else {
              await toaster.promise(promise, {
                loading: 'Updating settings',
                success: 'Hide author comments',
                error: 'Error updating settings',
              });
            }
          } else if (type === 'votes') {
            await toaster.promise(promise, {
              loading: 'Updating vote settings',
              success: 'Vote settings updated',
              error: 'Error updating vote settings',
            });
          } else {
            await toaster.promise(promise, {
              loading: 'Updating settings',
              success: 'Settings has been updated',
              error: 'Error updating settings',
            });
          }
        } catch (e) {
          console.error(e);
        }
      })();
    },
    [updateBoardSettings, organizationId, retrospectiveId],
  );

  return (
    <div id="results" ref={printRef}>
      <WordCounterErrorModal
        showModal={showAiWordError}
        setShowModal={setShowAiWordError}
        message="This data is too large for our AI to Analyze"
      />
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
                      if (typeof window !== 'undefined') {
                        onUpdateRoleMemberRequested(
                          'href',
                          `/board/${retrospectiveId}`,
                        );
                      }
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
                          setShowAuthors(!showAuthors);
                          onUpdateBoardSettings(
                            'authors',
                            !showAuthors,
                            'sidebar',
                          );
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
                        organizationId={organizationId}
                        userId={member.userId}
                        key={`${index} ${member.userId}`}
                        name={member.fullName}
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
            <If condition={canUseAI}>
              <SectionTitleBar
                title="Ai Insights - Patterns / Actions"
                color={'purple-100'}
              >
                <BaseInfo image={brain} />
              </SectionTitleBar>
              <div className="print:hidden">
                <AiNotConfiguredNotice className={'mb-4'} />

                <If condition={currentUserRole === MembershipRole.Admin}>
                  <RegenerateAiButton
                    onAction={() => {
                      aiCanceled.current = false;
                      getPatternsAdviceAI();
                    }}
                  />
                </If>
              </div>

              {!loadingAI ? (
                <div className="border rounded-lg p-8 space-y-6">
                  <If condition={errorAI != ''}>
                    <p>{errorAI}</p>
                  </If>
                  {patternsAI ? (
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
                      ))
                  ) : (
                    <div>
                      <p>No comments</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <LoadingMembersSpinner />
                  <button
                    onClick={onCancelAI}
                    className="px-4 py-2 mt-4 bg-[#EF4444] text-white rounded hover:bg-red-600 focus:outline-none"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </If>

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
                        organizationId={organizationId}
                        participant={item.user}
                        userId={item.assignee != '' ? item.user.id : ''}
                        comment={item}
                        canShowAuthors={retrospective.authors}
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
                              organizationId={organizationId}
                              participant={item.user}
                              userId={item.assignee != '' ? item.user.id : ''}
                              comment={item}
                              votes={item.votes}
                              canShowAuthors={retrospective.authors}
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
                                      organizationId={organizationId}
                                      participant={comment?.user}
                                      comment={comment}
                                      userId={
                                        comment?.assignee != ''
                                          ? comment?.user.id
                                          : ''
                                      }
                                      canShowAuthors={retrospective.authors}
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
