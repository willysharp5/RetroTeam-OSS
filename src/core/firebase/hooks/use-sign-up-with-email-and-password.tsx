import { useAuth, useUser } from 'reactfire';
import { useCallback, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { EmailAuthProvider, UserCredential } from 'firebase/auth';
import { useRequestState } from '../../hooks/use-request-state';
import Cookies from 'js-cookie';

import configuration from '~/configuration';
import { useRouter } from 'next/router';
import useAddAnonymousMemberToOrganizationTeam from '~/lib/teams/hooks/use-add-anonymous-member-to-organization-team';
import useAddAnonymousUserData from '~/lib/organizations/hooks/use-add-anonymous-user-data';
import useAddAnonymousMemberToTeamBoard from '~/lib/board/hooks/use-add-anonymous-member-to-team-board';

export function useSignUpWithEmailAndPassword() {
  const auth = useAuth();
  const user: any = useUser();

  const { state, setLoading, setData, setError } = useRequestState<
    UserCredential,
    FirebaseError
  >();

  const [error, setErrorMessage] = useState<any>();

  const router = useRouter();

  const organizationId = Cookies.get('organizationInvite')
    ? atob(Cookies.get('organizationInvite') as string)
    : '';
  const teamId = Cookies.get('teamIdInvite')
    ? atob(Cookies.get('teamIdInvite') as string)
    : '';
  const boardId = Cookies.get('boardIdInvite')
    ? atob(Cookies.get('boardIdInvite') as string)
    : '';
  const emailInvite = Cookies.get('emailInvite')
    ? atob(Cookies.get('emailInvite') as string)
    : '';
  const boardTeam = Cookies.get('boardTeam')
    ? atob(Cookies.get('boardTeam') as string)
    : '';

  const { trigger: addMemberToOrganizationTeam, isMutating } =
    useAddAnonymousMemberToOrganizationTeam(organizationId, teamId);

  const { trigger: addMemberToBoard, isMutating: loadingBoard } =
    useAddAnonymousMemberToTeamBoard(boardId, organizationId, boardTeam);

  const { trigger: addUserData } = useAddAnonymousUserData();

  const redirectToHomePage = useCallback(() => {
    const homePage = configuration.paths.appHome;

    return router.push(homePage);
  }, [router]);

  const redirectToBoardPage = useCallback(() => {
    const path = getDeepLinkPath(organizationId, `/board/${boardId}`);
    return router.push(path);
  }, [router, organizationId, boardId]);

  function getDeepLinkPath(organizationId: string, path: string) {
    return ['', organizationId, path.slice(1, path.length)].join('/');
  }
  const signUp = useCallback(
    async (email: string, password: string) => {
      setLoading(true);

      try {
        let credential;

        if (user.data) {
          const { linkWithCredential } = await import('firebase/auth');

          const emailCredential = EmailAuthProvider.credential(email, password);

          credential = await linkWithCredential(user.data, emailCredential);

          if (credential) {
            const userId = credential.user.uid as string;

            const code = Cookies.get('codeInvite')
              ? atob(Cookies.get('codeInvite') as string)
              : undefined;

            const name = Cookies.get('nameInvite')
              ? atob(Cookies.get('nameInvite') as string)
              : '';

            const lastName = Cookies.get('lastNameInvite')
              ? atob(Cookies.get('lastNameInvite') as string)
              : '';

            if (code && !boardId) {
              await addMemberToOrganizationTeam({ code, userId }).then(() => {
                const Userbody = {
                  name,
                  lastName,
                  email: emailInvite,
                  userId,
                };
                addUserData(Userbody)
                  .then(() => {
                    redirectToHomePage();
                  })
                  .catch((e: any) => {
                    console.error('Error on addUserData: ', e);
                  });
              });
            } else if (boardId && code) {
              const type = 'team';
              await addMemberToBoard({
                code,
                userId,
                type,
                name,
                lastName,
              }).then(() => {
                redirectToBoardPage();
              });
            }
          }
        } else {
          const { createUserWithEmailAndPassword } = await import(
            'firebase/auth'
          );

          credential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );
        }

        setData(credential);

        return credential;
      } catch (error) {
        setError(error as FirebaseError);
        setErrorMessage(error as FirebaseError);

        console.error('Sign up firebase error: ', error);
      } finally {
        setLoading(false);
      }
    },
    [
      auth,
      user,
      setData,
      setError,
      setLoading,
      addMemberToOrganizationTeam,
      addMemberToBoard,
      addUserData,
      boardId,
      emailInvite,
      redirectToBoardPage,
      redirectToHomePage,
    ],
  );

  const isAnonymous = user.data ? true : false;

  return [signUp, state, isAnonymous, error] as [
    typeof signUp,
    typeof state,
    typeof isAnonymous,
    typeof error,
  ];
}
