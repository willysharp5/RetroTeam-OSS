import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from 'reactfire';
import {
  OrganizationInfoStep,
  OrganizationInfoStepData,
} from './OrganizationInfoStep';
import configuration from '~/configuration';
import Layout from '~/core/ui/Layout';
import Head from 'next/head';
import Image from 'next/image';
import If from '~/core/ui/If';
import { CompleteOnboardingStep } from './CompleteOnboardingStep';
import Logo from 'public/assets/svg/logo_orange.svg';

interface Data {
  organization: string;
  teams: object;
  name: string;
  lastName: string;
  email: string;
}

const appHome = configuration.paths.appHome;

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Data>();
  const router = useRouter();
  const [nextStep, setNextStep] = useState(1);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const auth = useAuth();
  const user = auth.currentUser;

  const onFirstStepSubmitted = useCallback(
    (organizationInfo: OrganizationInfoStepData) => {
      setData({
        organization: organizationInfo.organization,
        teams: organizationInfo.teams,
        name: organizationInfo.name,
        lastName: organizationInfo.lastName,
        email: organizationInfo.email,
      });
      setFirstName(organizationInfo.name);
      setLastName(organizationInfo.lastName);
      setCurrentStep(1);
    },
    [],
  );

  // prefetch application home route
  useEffect(() => {
    void router.prefetch(appHome);
  }, [router]);

  const onComplete = useCallback(() => {
    void router.push(appHome);
  }, [router]);

  return (
    <Layout>
      <Head>
        <title key="title">Onboarding</title>
      </Head>
      <div className="my-10 mx-6 border-b border-[#E4E4E7]">
        <div className="flex">
          <Image height={14} width={27} alt="logo" src={Logo}></Image>
          <p className="ml-2 text-[#FA6400] text-lg">Retroteam</p>
        </div>
        {nextStep === 1 ? (
          <div className="my-6">
            <h1 className="text-2xl font-bold">Organization and Team Name</h1>
            <p className="text-zinc-500">
              Welcome to RetroTeam - Lets get you started with your Organization
              and Team name
            </p>
          </div>
        ) : (
          nextStep === 2 && (
            <div className="my-6">
              <h1 className="text-2xl font-bold">Hi, Nice to meet you!</h1>
              <p className="text-zinc-500">Please enter your name</p>
            </div>
          )
        )}
      </div>

      <div
        className={
          'md:mx-0 mx-6 flex h-screen flex-1 flex-col items-center mt-12' +
          ' w-full space-y-24'
        }
      >
        <div className={'w-full max-w-xl '}>
          <If condition={currentStep === 0}>
            <OrganizationInfoStep
              onSubmit={onFirstStepSubmitted}
              nextStep={nextStep}
              setNextStep={setNextStep}
            />
          </If>

          <If condition={currentStep === 1 && data}>
            {(data) => (
              <CompleteOnboardingStep data={data} onComplete={onComplete} />
            )}
          </If>
        </div>
      </div>
    </Layout>
  );
};

export default OnboardingPage;
