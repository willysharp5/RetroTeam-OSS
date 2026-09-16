import {
  Fragment,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast, type Toast } from 'react-hot-toast';
import { useSigninCheck } from 'reactfire';

import { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import { Trans } from 'next-i18next';
import Image from 'next/image';

import Logo from 'public/assets/svg/LogoText.svg';
import school from 'public/assets/svg/school.svg';

import { withUserProps } from '~/lib/props/with-user-props';
import {
  getTeamInviteByCode,
  getUserRoleByTeam,
} from '~/lib/server/organizations/memberships';
import useAddMemberToOrganizationTeam from '~/lib/teams/hooks/use-add-member-to-organization-team';

import logger from '~/core/logger';
import If from '~/core/ui/If';
import Button from '~/core/ui/Button';
import { isBrowser } from '~/core/generic/is-browser';
import PageLoadingIndicator from '~/core/ui/PageLoadingIndicator';
import { initializeFirebaseAdminApp } from '~/core/firebase/admin/initialize-firebase-admin-app';
import GuardedPage from '~/core/firebase/components/GuardedPage';
import createCsrfToken from '~/core/generic/create-csrf-token';
import Layout from '~/core/ui/Layout';
import TextField from '~/core/ui/TextField';

import EmailPasswordSignInContainer from '~/components/auth/EmailPasswordSignInContainer';
import PhoneNumberSignInContainer from '~/components/auth/PhoneNumberSignInContainer';
import EmailLinkAuth from '~/components/auth/EmailLinkAuth';
import AnonymousUsersSignUpContainer from '~/components/auth/AnonymousUsersSignUpContainer';

import configuration from '~/configuration';

import getRandomName from 'src/constants/Names';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { useGetOrganizationById } from '~/lib/organizations/hooks/use-get-organization-by-id';
import FirebaseFirestoreProvider from '~/core/firebase/components/FirebaseFirestoreProvider';

enum Mode {
  SignUp,
  SignIn,
}

interface Invite {
  code: string;
  created: any;
  email: string;
  facilitator: string;
  organization: {
    id: string;
    name: string;
  };
  team: {
    id: string;
    name: string;
  };
}

interface User {
  lastName: string;
  name: string;
  email: string;
  id: string;
}

const InvitePage = (
  props: PropsWithChildren<{
    session: Maybe<User>;
    invite: Invite;
    user: User;
  }>,
) => {
  const router = useRouter();

  const invite = props.invite;
  const organization = invite.organization;
  const team = invite.team;

  const { trigger: addMemberToOrganization, isMutating } =
    useAddMemberToOrganizationTeam(organization.id, team.id);

  const [currentSession, setCurrentSession] = useState(props.session);
  const [user, setUser] = useState<User | undefined>(props.user);

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');

  const signInCheck = useSigninCheck();

  const fullName = useMemo(() => getRandomName(), []);
  const [randomName, randomName2] = fullName.split(' ');

  useEffect(() => {
    if (!currentSession) {
      setName(randomName);
      setLastName(randomName2);
    }
  }, [currentSession, randomName, randomName2]);

  const [loading, setLoading] = useState(false);

  const redirectToHomePage = useCallback(() => {
    const homePage = configuration.paths.appHome;
    return router.push(`/${organization.id}${homePage}`);
  }, [router, organization]);

  const redirectToSignUpPage = useCallback(() => {
    const tokenOrganization = btoa(invite.organization.id);
    const tokenOrganizationName = btoa(invite.organization.name);
    const tokenTeam = btoa(invite.team.name);
    const tokenTeamId = btoa(invite.team.id);
    const tokenInvite = btoa(invite.code);
    const tokenEmail = btoa(invite.email);
    const tokenFacilitator = btoa(invite.facilitator);
    const tokenName = btoa(name);
    const tokenLastName = btoa(lastName);

    const signUpPage = `${configuration.paths.signUp}`;

    Cookies.set('organizationInvite', tokenOrganization);
    Cookies.set('organizationNameInvite', tokenOrganizationName);
    Cookies.set('teamInvite', tokenTeam);
    Cookies.set('teamIdInvite', tokenTeamId);
    Cookies.set('codeInvite', tokenInvite);
    Cookies.set('emailInvite', tokenEmail);
    Cookies.set('facilitatorInvite', tokenFacilitator);
    Cookies.set('nameInvite', tokenName);
    Cookies.set('lastNameInvite', tokenLastName);
    return router.push(signUpPage);
  }, [router, name, lastName, invite]);

  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (signInCheck.status === 'success' && !signInCheck.data.signedIn) {
      setCurrentSession(undefined);
      setUser(undefined);
    }
  }, [signInCheck]);

  const onInviteAccepted = useCallback(async () => {
    const body = { code: invite.code };
    setLoading(true);
    if (currentSession) {
      addMemberToOrganization(body).then(() => {
        toast(
          (t: Toast) => (
            <div className="flex justify-between items-center">
              <div>
                <b className="text-md">Team Invite</b>
                <br />
                <p className="inline text-sm">
                  {user?.name} {user?.lastName}&nbsp;you have been invited
                  to&nbsp;
                  <b>
                    {organization?.name} - {invite.team.name}
                  </b>
                  &nbsp;by&nbsp;{invite.facilitator}. To view the team
                  you&apos;ve been invited to, select the
                  <span className="inline-block align-middle">
                    <Image className="ml-1" src={school} alt="school" />
                  </span>{' '}
                  Organization above.
                </p>
              </div>
              <button
                className="ml-auto mt-2 border border-blue-500 rounded-md text-blue-500 py-2 px-4"
                onClick={() => toast.dismiss(t.id)}
              >
                Ok
              </button>
            </div>
          ),
          {
            duration: Infinity,
            position: 'bottom-right',
          },
        );
        redirectToHomePage();
      });
    } else {
      redirectToSignUpPage();
    }
  }, [
    addMemberToOrganization,
    redirectToHomePage,
    currentSession,
    invite,
    organization,
    redirectToSignUpPage,
    user,
  ]);

  useEffect(() => {
    if (invite) {
      const created = invite.created;
      const createdDate = new Date(created);

      const currentDateTime = new Date();

      const timeDifference = currentDateTime.getTime() - createdDate.getTime();
      const hoursSinceCreation = Math.floor(timeDifference / (1000 * 60 * 60));

      if (hoursSinceCreation > 24) {
        setExpired(true);
      }
    }
  }, [invite]);

  if (loading) {
    return (
      <PageLoadingIndicator>
        <Trans
          i18nKey={'auth:addingToTeam'}
          values={{ name: organization.name, team: team.name }}
          components={{ b: <b /> }}
        />
      </PageLoadingIndicator>
    );
  }

  return (
    <>
      <FirebaseFirestoreProvider>
        <Layout>
          <Screen
            organization={organization}
            user={user}
            isExpired={expired}
            currentSession={currentSession}
            invite={invite}
            team={team}
            onInviteAccepted={onInviteAccepted}
            name={name}
            setName={setName}
            setLastName={setLastName}
            lastName={lastName}
          />
        </Layout>
      </FirebaseFirestoreProvider>
    </>
  );
};

const Screen = ({
  organization,
  user,
  isExpired,
  currentSession,
  invite,
  team,
  onInviteAccepted,
  name,
  setName,
  setLastName,
  lastName,
}: any) => {
  const [mode, setMode] = useState<Mode>(Mode.SignUp);

  const redirectOnSignOut = getRedirectPath();

  const { organization: organizationData } = useGetOrganizationById(
    organization.id,
  );

  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadingData(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  if (loadingData) {
    return (
      <PageLoadingIndicator>
        <p>Loading invite...</p>
      </PageLoadingIndicator>
    );
  }

  return (
    <Fragment>
      <div className="py-4 px-6 border-b border-[#E4E4E7]">
        <Link href={'/dashboard'} className="flex">
          <Image alt="logo" src={Logo} width={107}></Image>
        </Link>
      </div>

      {!isExpired ? (
        <div
          style={{ marginBottom: 100 }}
          className={'flex md:justify-center items-center h-screen'}
        >
          <div className="border md:px-[100px] py-6 rounded-lg  px-16 ">
            <Fragment>
              <If condition={currentSession}>
                <p className="text-xl text-center font-semibold mb-1.5">
                  Hello {user?.name} {user?.lastName}!
                </p>
                <div>
                  <p className={'text-center text-zinc-500 text-sm mb-10'}>
                    You have been invited by {invite.facilitator} to join{' '}
                    {organization.name} - {team.name}.
                  </p>
                </div>
              </If>
              <If condition={!currentSession}>
                <p className="text-xl text-center font-semibold mb-1.5">
                  Hi! nice to meet you
                </p>
                <div>
                  <p className={'text-center text-zinc-500 text-sm mb-10'}>
                    You have been invited by {invite.facilitator} to join{' '}
                    {organization.name} - {team.name}.<br></br> Please fill in
                    your name.
                  </p>
                </div>
              </If>
              <div className={'w-full max-w-xl m-auto'}>
                {/* FLOW FOR AUTHENTICATED USERS */}
                <If condition={currentSession}>
                  <GuardedPage whenSignedOut={redirectOnSignOut}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        return onInviteAccepted();
                      }}
                      className={'flex flex-col space-y-8'}
                    >
                      <Button
                        data-cy={'accept-invite-submit-button'}
                        type={'submit'}
                        className="flex w-full justify-center mt-[50px]"
                        color={'secondary'}
                      >
                        Join
                      </Button>
                    </form>
                  </GuardedPage>
                </If>

                {/* FLOW FOR NEW USERS */}
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
                            value={name}
                          ></TextField.Input>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Last name</p>
                          <TextField.Input
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => setLastName(e.target.value)}
                            value={lastName}
                          ></TextField.Input>
                        </div>
                      </div>
                      <AnonymousUsersSignUpContainer
                        onSignUp={onInviteAccepted}
                        isInviting={true}
                        name={name}
                        lastName={lastName}
                      ></AnonymousUsersSignUpContainer>
                    </If>

                    <If condition={mode === Mode.SignIn}>
                      <div
                        className={
                          'flex w-full flex-col items-center space-y-4'
                        }
                      >
                        <EmailPasswordSignInContainer
                          onSignIn={onInviteAccepted}
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

                  <If condition={configuration.auth.providers.phoneNumber}>
                    <PhoneNumberSignInContainer onSignIn={onInviteAccepted} />
                  </If>

                  <If condition={configuration.auth.providers.emailLink}>
                    <EmailLinkAuth inviteCode={invite.code} />
                  </If>
                </If>
              </div>
            </Fragment>
          </div>
        </div>
      ) : (
        <div
          style={{ marginBottom: 100 }}
          className={'flex md:justify-center items-center h-screen'}
        >
          <div className="">
            <If condition={!currentSession}>
              <p className="text-red-500 text-xl text-center font-semibold mb-1.5">
                The invitation has expired
              </p>
            </If>
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default InvitePage;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  // we need to create the admin app before
  // we can use Firestore on the server-side
  await initializeFirebaseAdminApp();

  const { props } = await withUserProps(ctx);
  const userId = props.session?.uid;
  const code = ctx.params?.code as Maybe<string>;
  const user = props.user;

  // if the code wasn't provided we cannot continue
  // so, we redirect to 404
  if (!code) {
    return notFound();
  }

  try {
    const inviteRef = await getTeamInviteByCode(code);
    const invite = inviteRef?.data();

    // if the invite wasn't found, it's 404
    if (!invite) {
      logger.warn(
        {
          code,
        },
        `User navigated to invite page, but it wasn't found. Redirecting to home page...`,
      );

      return notFound();
    }

    const organizationId = invite.organization.id;
    const teamId = invite.team.id;

    const createdTimestamp = invite.created.toDate().getTime(); // Convert to Unix timestamp

    const serializableInvite = {
      ...invite,
      created: createdTimestamp,
    };

    // We check if the user is already part of the organization
    if (userId) {
      const userRole = await getUserRoleByTeam({
        userId,
        organizationId,
        teamId,
      });

      const isPartOfTeam = userRole !== undefined;

      // if yes, we redirect the user to the error page
      if (isPartOfTeam) {
        return redirectToTeamPage(organizationId, teamId);
      }
    }

    const csrfToken = await createCsrfToken(ctx);

    return {
      props: {
        ...props,
        invite: serializableInvite,
        csrfToken,
        user,
      },
    };
  } catch (e) {
    logger.debug(e);

    logger.error(
      `Error encountered while fetching invite. Redirecting to home page...`,
    );

    return redirectToHomePage();
  }
}

function redirectToHomePage() {
  return {
    redirect: {
      permanent: false,
      destination: '/',
    },
  };
}

function redirectToTeamPage(organizationId: string, teamId: string) {
  return {
    redirect: {
      permanent: false,
      destination: `/${organizationId}/settings/teams/${teamId}`,
    },
  };
}

function getRedirectPath() {
  return isBrowser() ? window.location.pathname : undefined;
}

function notFound() {
  return {
    notFound: true,
  };
}
