import { GetServerSidePropsContext } from 'next';
import dynamic from 'next/dynamic';

import { withAppProps } from '~/lib/props/with-app-props';
import RouteShell from '~/components/RouteShell';
import toast, { type Toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import school from 'public/assets/svg/school.svg';
import Cookies from 'js-cookie';
import Image from 'next/image';

const DashboardDemo = dynamic(
  () => import('~/components/dashboard/DashboardDemo'),
  { ssr: false },
);

const Dashboard = () => {
  const [toastDisplayed, setToastDisplayed] = useState(false);

  const teamName = Cookies.get('teamInvite')
    ? atob(Cookies.get('teamInvite') as string)
    : undefined;

  const organizationName = Cookies.get('organizationNameInvite')
    ? atob(Cookies.get('organizationNameInvite') as string)
    : undefined;

  const name = Cookies.get('nameInvite')
    ? atob(Cookies.get('nameInvite') as string)
    : undefined;

  const lastName = Cookies.get('lastNameInvite')
    ? atob(Cookies.get('lastNameInvite') as string)
    : undefined;

  const facilitator = Cookies.get('facilitatorInvite')
    ? atob(Cookies.get('facilitatorInvite') as string)
    : undefined;

  useEffect(() => {
    if (
      !toastDisplayed &&
      name &&
      lastName &&
      organizationName &&
      teamName &&
      facilitator
    ) {
      toast(
        (t: Toast) => (
          <div className="flex justify-between items-center">
            <div>
              <b className="text-md">Team Invite</b>
              <br />
              <p className="inline text-sm">
                {name} {lastName}&nbsp;you have been invited to&nbsp;
                <b>
                  {organizationName} - {teamName}
                </b>
                &nbsp;by&nbsp;{facilitator}. To view the team you&apos;ve been
                invited to, select the
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
      setToastDisplayed(true);
      Cookies.remove('facilitatorInvite');
      Cookies.remove('nameInvite');
      Cookies.remove('lastNameInvite');
      Cookies.remove('organizationNameInvite');
      Cookies.remove('teamIdInvite');
      Cookies.remove('teamInvite');
    }
  }, []);

  return (
    <>
      <div id="overlay"></div>
      <div id="dashboard">
        <RouteShell title={'Dashboard'}>
          <DashboardDemo />
        </RouteShell>
      </div>
    </>
  );
};

export default Dashboard;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAppProps(ctx);
}
