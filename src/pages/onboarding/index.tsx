import { GetServerSidePropsContext } from 'next';

import configuration from '~/configuration';
import { withUserProps } from '~/lib/props/with-user-props';

import { withTranslationProps } from '~/lib/props/with-translation-props';
import OnboardingPage from '~/components/onboarding/OnBoardingPage';
import FirebaseFirestoreProvider from '~/core/firebase/components/FirebaseFirestoreProvider';

const Onboarding = () => {
  return (
    <>
      <FirebaseFirestoreProvider>
        <OnboardingPage />
      </FirebaseFirestoreProvider>
    </>
  );
};

export default Onboarding;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { props } = await withUserProps(ctx);
  const user = props.session;

  if (!user) {
    return redirectToSignIn();
  }

  const isEmailVerified = user.emailVerified;
  const requireEmailVerification = configuration.auth.requireEmailVerification;

  if (requireEmailVerification && !isEmailVerified) {
    return redirectToSignIn();
  }

  const userData = await getUserData(user.uid);
  const translationProps = await withTranslationProps(ctx);

  // if we cannot find the user's Firestore record
  // the user should go to the onboarding flow
  // so that the record wil be created after the end of the flow
  if (!userData) {
    return {
      ...translationProps,
      props,
    };
  }

  const { getCurrentOrganization } = await import(
    '~/lib/server/organizations/get-current-organization'
  );

  const organization = await getCurrentOrganization(user.uid);
  const { onboarded } = user.customClaims;

  if (onboarded && organization) {
    return redirectToAppHome(ctx.locale);
  }

  return {
    ...translationProps,
    props,
  };
}

function redirectToSignIn() {
  const paths = configuration.paths;

  const destination = [
    paths.signIn,
    `?returnUrl=${paths.onboarding}&signOut=true`,
  ].join('/');

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
}

function redirectToAppHome(locale: string | undefined) {
  const localePrefix = locale ? `/${locale}` : '';
  const destination = `${localePrefix}${configuration.paths.appHome}`;

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
}

/**
 * @name getUserData
 * @description Fetch User Firestore data decorated with its ID field
 * @param userId
 */
async function getUserData(userId: string) {
  const { getUserRefById } = await import('~/lib/server/queries');

  const ref = await getUserRefById(userId);
  const data = ref.data();

  if (data) {
    return {
      ...data,
      id: ref.id,
    };
  }
}
