import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth, useSigninCheck } from 'reactfire';

import { Trans } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

import Logo from 'public/assets/svg/LogoText.svg';

import useAddUserData from '~/lib/organizations/hooks/use-add-user-data';

import If from '~/core/ui/If';
import Button from '~/core/ui/Button';
import PageLoadingIndicator from '~/core/ui/PageLoadingIndicator';
import Layout from '~/core/ui/Layout';
import TextField from '~/core/ui/TextField';

import EmailPasswordSignInContainer from '~/components/auth/EmailPasswordSignInContainer';
import AnonymousUsersSignUpContainer from '~/components/auth/AnonymousUsersSignUpContainer';

import configuration from '~/configuration';

import getRandomName from 'src/constants/Names';

import useAddMemberToOrganization from '~/lib/board/hooks/use-add-member-to-organization';
import { useGetBoardByRetrospectiveId } from '~/lib/board/hooks/use-get-board-by-retrospective';
import useRequestBoardAccess from '~/lib/board/hooks/use-request-board-access';
import useFetchUserById from '~/lib/server/user/get-current-user';
import { useGetOrganizationById } from '~/lib/organizations/hooks/use-get-organization-by-id';

import Cookies from 'js-cookie';

enum Mode {
  SignUp,
  SignIn,
}

const JoinBoardPage = () => {
  const router = useRouter();
  const { id, organizationId: orgId } = router.query;

  const retrospectiveId = id as string;
  const organizationId = orgId as string;

  const { organization: organizationData } =
    useGetOrganizationById(organizationId);

  const auth = useAuth();
  const currentUser = auth.currentUser;

  const [currentSession, setCurrentSession] = useState<any>(currentUser);

  const [mode, setMode] = useState<Mode>(Mode.SignUp);
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');

  const signInCheck = useSigninCheck();

  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading board...');

  const fullName = useMemo(() => getRandomName(), []);
  const [randomName, randomName2] = fullName.split(' ');

  const [requestedAccess, setRequestedAccess] = useState(false);
  const [requestingAcessStatus, setRequestingAcessStatus] = useState(false);
  const [requestStatus, setRequestStatus] = useState('');

  const [joiningBoard, setJoiningBoard] = useState(false);

  const { trigger: addUserData } = useAddUserData();

  const { trigger: addMemberToOrganization, isMutating } =
    useAddMemberToOrganization(organizationId);

  const { trigger: requestBoardAccess } =
    useRequestBoardAccess(retrospectiveId);

  const {
    retrospective,
    loading: loadingRetrospective,
    error,
    userHasRequested,
    requestedUser,
    members,
  } = useGetBoardByRetrospectiveId(organizationId, retrospectiveId);

  // Redirect to board page if user is already a member
  useEffect(() => {
    if (members.length > 0) {
      const isPartOfBoard = members.find(
        (item: any) => item.userId === currentUser?.uid,
      );
      if (isPartOfBoard) {
        redirectToBoardPage();
      }
    }
  }, [members, currentUser]);

  useEffect(() => {
    if (retrospective && !joiningBoard && !requestingAcessStatus) {
      setLoading(loadingRetrospective);
    }
  }, [
    retrospective,
    joiningBoard,
    requestingAcessStatus,
    loadingRetrospective,
  ]);

  // Fetch data for current user if it already requested access
  useEffect(() => {
    const fetchData = async (currentUser: any) => {
      setCurrentSession(currentUser);
      const hasRequested = (await userHasRequested(currentUser.uid)) as boolean;
      setRequestedAccess(hasRequested);
    };
    if (currentUser && requestedUser === null) {
      fetchData(currentUser);
    }
  }, [currentUser, requestedUser]);

  useEffect(() => {
    if (requestedAccess && requestedUser) {
      setName(requestedUser.name);
      setLastName(requestedUser.lastName);
      setRequestStatus(requestedUser.status);
    }
  }, [requestedUser, requestedAccess]);

  const redirectToBoardPage = useCallback(() => {
    const path = getDeepLinkPath(organizationId, `/board/${id}`);
    return router.push(path);
  }, [router, organizationId, id]);

  function getDeepLinkPath(organizationId: string, path: string) {
    return ['', organizationId, path.slice(1, path.length)].join('/');
  }

  const requestAccess = useCallback(
    async (userId: string) => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setRequestingAcessStatus(true);
      const body = {
        id,
        organizationId,
        userId: userId,
      } as any;

      requestBoardAccess(body)
        .then((res: any) => {
          if (res.success === true) {
            setRequestStatus('pending');
            setRequestingAcessStatus(false);
            setRequestedAccess(true);
            setLoading(false);
          } else {
            setRequestingAcessStatus(false);
          }
        })
        .catch((e) => {
          console.error('ERROR on requestAccess: ', e);
          setRequestingAcessStatus(false);
        });
    },
    [requestBoardAccess, id, organizationId],
  );

  const onSubmit = useCallback(
    async (email: string, userId: any) => {
      setLoading(true);
      const body = {
        name,
        lastName,
        retrospectiveId: id,
        organizationId,
        teamId: retrospective.teamId,
      } as any;

      const tokenName = btoa(name);
      const tokenLastName = btoa(lastName);

      Cookies.set('nameInvite', tokenName);
      Cookies.set('lastNameInvite', tokenLastName);

      if (retrospective.access.type === 'public') {
        setJoiningBoard(true);
        setLoadingMessage('Redirecting to board...');
        addMemberToOrganization(body)
          .then((res: any) => {
            if (res.success) {
              redirectToBoardPage();
            } else {
              console.error('Error on joining board member: ', res);
              setJoiningBoard(false);
            }
          })
          .catch((error: any) => {
            console.error('Error on joining board member: ', error);
            setJoiningBoard(false);
          });
      } else {
        setRequestingAcessStatus(true);
        setLoadingMessage('Requesting access...');
        const Userbody = { name: name, lastName: lastName, email: '' };
        addUserData(Userbody)
          .then((res: any) => {
            if (res.success) {
              requestAccess(userId);
            }
          })
          .catch((e) => {
            console.error('Error onSubmit user: ', e);
            setJoiningBoard(false);
          });
      }
    },
    [
      redirectToBoardPage,
      addUserData,
      name,
      lastName,
      retrospective,
      organizationId,
      id,
      addMemberToOrganization,
      requestAccess,
    ],
  );

  useEffect(() => {
    if (signInCheck.status === 'success' && !signInCheck.data.signedIn) {
      setCurrentSession(undefined);
    }
  }, [signInCheck]);

  useEffect(() => {
    if (!currentSession) {
      setName(randomName);
      setLastName(randomName2);
    }
  }, [currentSession]);

  const userData = useFetchUserById(retrospective?.createdBy);

  const [creatorName, setCreatorName] = useState('');

  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadingData(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (userData) setCreatorName(userData.fullName);
  }, [userData]);

  const [errorForm, setErrorForm] = useState();

  if (loading || loadingData || joiningBoard) {
    return <PageLoadingIndicator>{loadingMessage}</PageLoadingIndicator>;
  }

  return (
    <Layout>
      <div className="py-4 px-6 border-b border-[#E4E4E7]">
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex">
            <Image alt="logo" width={107} src={Logo}></Image>
          </div>
          <div className="flex w-full items-center ml-12">
            <Link
              href="/dashboard"
              className="text-sm border rounded px-2 py-x hover:bg-gray-50"
            >
              <p>Dashboard</p>
            </Link>
          </div>
        </div>
      </div>
      <div
        style={{ marginBottom: 100 }}
        className={'flex justify-center items-center h-screen'}
      >
        <div className="border md:px-[100px] py-6 rounded-lg  px-16 ">
          <Fragment>
            {retrospective?.access?.type != 'public' ? (
              <div className={'w-full max-w-xl m-auto'}>
                <p className={'text-center text-zinc-500 text-sm mb-1.5'}>
                  This board is{' '}
                  <b>
                    {retrospective?.access?.type === 'private'
                      ? 'Private'
                      : 'a team board'}
                  </b>
                  .
                </p>
                <p className={'text-center text-zinc-500 text-sm mb-1.5'}>
                  This board was created by <b>{creatorName}</b> in{' '}
                  <b>{retrospective?.teamData?.name}</b>.
                </p>

                <p className="text-xl text-center font-semibold mb-1.5">
                  Request access
                </p>
                <div>
                  <p className={'text-center text-zinc-500 text-sm mb-10'}>
                    Do you want to request access to <br />{' '}
                    <b>{retrospective?.name}</b>?
                  </p>
                  {/* REQUEST ACCESS FLOW FOR CURRENT USERS */}
                  <If condition={currentSession}>
                    <Button
                      disabled={requestedAccess || requestingAcessStatus}
                      onClick={() => requestAccess(currentUser?.uid as string)}
                      className="flex w-full justify-center"
                      color={'secondary'}
                    >
                      {requestStatus === 'pending'
                        ? 'Pending Facilitator Approval'
                        : requestStatus === 'denied'
                        ? 'Access denied'
                        : requestingAcessStatus
                        ? 'Requesting access...'
                        : ' Request access'}
                    </Button>
                  </If>
                </div>
                {/* REQUEST ACESS FLOW FOR NO USERS */}
                <If condition={!currentSession}>
                  <If condition={configuration.auth.providers.emailPassword}>
                    <If condition={mode === Mode.SignUp}>
                      <div className="flex space-x-4 justify-center">
                        <div>
                          <p className="text-sm font-medium">First name</p>
                          <TextField.Input
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => setName(e.target.value)}
                            disabled={requestedAccess}
                            value={name}
                          ></TextField.Input>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Last name</p>
                          <TextField.Input
                            disabled={requestedAccess}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => setLastName(e.target.value)}
                            value={lastName}
                          ></TextField.Input>
                        </div>
                      </div>
                      {!requestedAccess ? (
                        <AnonymousUsersSignUpContainer
                          onSignUp={onSubmit}
                          isInviting={true}
                          setLoading={setRequestingAcessStatus}
                        ></AnonymousUsersSignUpContainer>
                      ) : (
                        <Button
                          disabled
                          className="mt-[50px] flex w-full justify-center"
                          color={'secondary'}
                        >
                          Pending Facilitator Approval
                        </Button>
                      )}
                    </If>

                    <If condition={mode === Mode.SignIn}>
                      <div
                        className={
                          'flex w-full flex-col items-center space-y-4'
                        }
                      >
                        <EmailPasswordSignInContainer
                          onSignIn={onSubmit as any}
                        />

                        <Button
                          block
                          color={'transparent'}
                          size={'small'}
                          onClick={() => setMode(Mode.SignUp)}
                        >
                          <Trans i18nKey={'auth:doNotHaveAccountStatement'} />
                        </Button>
                      </div>
                    </If>
                  </If>
                </If>
              </div>
            ) : (
              <div className={'w-full max-w-xl m-auto'}>
                <If condition={!currentUser && !loading}>
                  <p className="text-xl text-center font-semibold mb-1.5">
                    Hi! nice to meet you
                  </p>
                  <div className="mb-10">
                    <p className={'text-center text-zinc-500 text-sm '}>
                      Please fill out the form to see the board <br />{' '}
                      <b>{retrospective?.name}</b>
                    </p>

                    <p className="text-red-500 text-center">{errorForm}</p>
                  </div>
                  <div className="flex space-x-4 justify-center">
                    <div>
                      <p className="text-sm font-medium">First name</p>
                      <TextField.Input
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setName(e.target.value)
                        }
                        disabled={requestedAccess}
                        value={name}
                      ></TextField.Input>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last name</p>
                      <TextField.Input
                        disabled={requestedAccess}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setLastName(e.target.value)
                        }
                        value={lastName}
                      ></TextField.Input>
                    </div>
                  </div>
                  <AnonymousUsersSignUpContainer
                    onSignUp={onSubmit}
                    isInviting={true}
                    setLoading={setJoiningBoard}
                    name={name}
                    lastName={lastName}
                    setErrorForm={setErrorForm}
                  ></AnonymousUsersSignUpContainer>
                </If>
                <If condition={currentUser && !loading && !joiningBoard}>
                  <p className={'text-center text-zinc-500 text-sm mb-1.5'}>
                    This board is{' '}
                    <b className="capitalize">{retrospective?.access?.type}</b>.
                  </p>
                  <p className={'text-center text-zinc-500 text-sm mb-1.5'}>
                    This board was created by <b>{creatorName}</b> in{' '}
                    <b>{retrospective?.teamData?.name}</b>.
                  </p>
                  <p className="text-xl text-center font-semibold mb-1.5">
                    Hello!
                  </p>

                  <div>
                    <p className={'text-center text-zinc-500 text-sm mb-10'}>
                      You are about to join <b>{retrospective?.name}</b>.
                    </p>
                  </div>
                  <Button
                    onClick={() => onSubmit('', currentUser?.uid)}
                    className="flex w-full justify-center"
                    color={'secondary'}
                  >
                    Join
                  </Button>
                </If>
              </div>
            )}
          </Fragment>
        </div>
      </div>
    </Layout>
  );
};

export default JoinBoardPage;
