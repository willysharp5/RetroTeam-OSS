import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from 'reactfire';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';

import ProfileDropdown from '~/components/ProfileDropdown';

import Logo from '../../../../public/assets/svg/LogoText.svg';
import userPlus from 'public/assets/svg/user-plus-3.svg';
import timer from 'public/assets/svg/timer.svg';

import TimerSidebar from '~/components/shared/timerSidebar';
import configuration from '~/configuration';
import toaster from 'react-hot-toast';

import { useTranslation } from 'react-i18next';

import { TeamMembers } from '~/lib/teams/types/teams';

import { useGetDemoRetrospective } from '~/lib/server/demo/get-demo-retrospective';
import MembersSidebarDemo from '~/components/shared/demo/MembersSidebarDemo';
import { useUserSession } from '~/core/hooks/use-user-session';

interface IcebreakerHeaderProps {
  showMembersSidebar: boolean;
  setShowMembersSidebar: (show: boolean) => void;
  minute: any;
  setMinute: (minute: any) => void;
  second: any;
  setSecond: (second: any) => void;
  sound: any;
  setSound: (sound: any) => void;
  setPlay: (play: boolean) => void;
  setPause: (pause: boolean) => void;
  setShowPlayModal: (show: boolean) => void;
  showTimerSidebar: boolean;
  setShowTimerSidebar: (show: boolean) => void;
}

const MobileNavigation = dynamic(() => import('~/components/MobileNavigation'));

const DemoIcebreakerHeader: React.FCC<IcebreakerHeaderProps> = ({
  setShowPlayModal,
  minute,
  setMinute,
  second,
  setSecond,
  sound,
  setSound,
  setPlay,
  setPause,
  showMembersSidebar,
  setShowMembersSidebar,
  showTimerSidebar,
  setShowTimerSidebar,
}) => {
  const { t } = useTranslation('organization');

  const { retrospective, loading, error, fetchBoard } =
    useGetDemoRetrospective();
  const userSession = useUserSession();
  const [access, setAccess] = useState('');
  const [boardMembers, setBoardMembers] = useState<TeamMembers[]>([]);

  const [totalFacilitators, setTotalFacilitators] = useState(0);

  const auth = useAuth();

  useEffect(() => {
    if (retrospective) {
      setAccess(retrospective?.access?.type);
      const _members = Object.values(retrospective.members) as any;

      const activeMembers = _members.filter(
        (member: TeamMembers) => member.active === true,
      );
      setBoardMembers(activeMembers);
      const removedMembers = _members.filter(
        (member: TeamMembers) => member.active === false,
      );
      const facilitatorMembers = activeMembers.filter(
        (member: TeamMembers) => member.role > 0,
      );
      const totalFacilitators = facilitatorMembers.length;
      setTotalFacilitators(totalFacilitators);
    }
  }, [retrospective]);

  function copyURLink() {
    let siteUrl = configuration.site.siteUrl;

    assertSiteUrl(siteUrl);

    const url = `${siteUrl}/demo/icebreaker`;

    navigator.clipboard
      .writeText(url)
      .then(() => {
        toaster.success('Copied to clipboard');
      })
      .catch((error) => {
        console.log(error);
        toaster.error('Something went wrong');
      });
  }

  // Invitation functions

  function assertSiteUrl(siteUrl: Maybe<string>): asserts siteUrl is string {
    if (!siteUrl && configuration.production) {
      throw new Error(
        `Please configure the "siteUrl" property in the configuration file ~/configuration.ts`,
      );
    }
  }

  return (
    <>
      <div className="flex sticky items-center justify-between border-b border-[#E4E4E7] pb-3 px-8 py-6 tv:px-36">
        <div className={'flex items-center '}>
          <div className={'flex items-center lg:hidden'}>
            <MobileNavigation />
          </div>

          <div className={'hidden md:flex items-center lg:space-x-4'}>
            <div className="flex">
              <Image alt="logo" width={207} src={Logo}></Image>
            </div>
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
        <div className={'flex items-center justify-center space-x-4'}>
          <button onClick={() => setShowTimerSidebar(true)}>
            <Image src={timer} alt="timer"></Image>
          </button>

          <button onClick={() => setShowMembersSidebar(true)}>
            <Image src={userPlus} alt="userPlus"></Image>
          </button>

          <ProfileDropdown
            user={userSession}
            signOutRequested={() => {}}
            isDemo={true}
          />
        </div>
      </div>
      {showMembersSidebar && (
        <div className="absolute">
          <MembersSidebarDemo
            setShowMembersSidebar={setShowMembersSidebar}
            URLink={'/demo/icebreaker'}
            loading={false}
            pendingInvites={[]}
            copyToClipBoard={copyURLink}
            totalFacilitators={totalFacilitators}
            isBoard={false}
            activeMembers={boardMembers}
          />
        </div>
      )}
      {showTimerSidebar && (
        <div className="absolute">
          <TimerSidebar
            setShowTimerSidebar={setShowTimerSidebar}
            minute={minute}
            setMinute={setMinute}
            second={second}
            setSecond={setSecond}
            setSound={setSound}
            sound={sound}
            setPlay={setPlay}
            setPause={setPause}
            retrospectiveId="demo"
            organizationId="organizationId"
          />
        </div>
      )}
    </>
  );
};

export default DemoIcebreakerHeader;
