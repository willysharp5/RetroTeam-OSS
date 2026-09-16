import { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { SidebarContext } from '~/core/contexts/sidebar';

import add from 'public/assets/svg/plus-circled.svg';
import icebreaker from 'public/assets/svg/ice-cream.svg';
import If from '~/core/ui/If';

interface TopMenuTabsProps {
  filters: any;
  setFilters: (filters: any) => void;
  isRetrospective?: boolean;
}

function TopMenuTabs({
  filters,
  setFilters,
  isRetrospective = false,
}: TopMenuTabsProps) {
  const { collapsed } = useContext(SidebarContext);

  const [selectedTab, setSelectedTab] = useState(1);

  useEffect(() => {
    const tabActions: { [key: number]: any } = {
      1: () => setFilters({}),
      2: () => setFilters({ ownBoards: true }),
      3: () => setFilters({ sharedBoards: true }),
      4: () => setFilters({ teamBoards: true }),
      5: () => setFilters({ archived: true }),
    };

    tabActions[selectedTab]();
  }, [selectedTab]);

  return (
    <div className={`text-sm space-y-5 px-8 tv:px-36`}>
      {' '}
      <div className="xl:flex justify-between space-y-5 xl:space-y-0">
        <div className="md:flex overflow-x-hidden flex-wrap  text-zinc-400 bg-zinc-100 rounded-lg px-1.5 py-2 h-fit">
          <div
            className={`py-1 px-3 rounded-sm ${
              selectedTab === 1 ? 'bg-white text-zinc-600' : ''
            } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer`}
            onClick={() => setSelectedTab(1)}
          >
            <p>{`Organization Boards`}</p>
          </div>
          <div
            className={`py-1 px-3 rounded-sm ${
              selectedTab === 2 ? 'bg-white text-zinc-600' : ''
            } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer`}
            onClick={() => setSelectedTab(2)}
          >
            <p>My Boards</p>
          </div>
          <div
            className={`py-1 px-3 rounded-sm ${
              selectedTab === 3 ? 'bg-white text-zinc-600' : ''
            } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer`}
            onClick={() => setSelectedTab(3)}
          >
            <p>Shared Boards</p>
          </div>
          <div
            className={`py-1 px-3 rounded-sm ${
              selectedTab === 4 ? 'bg-white text-zinc-600' : ''
            } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer`}
            onClick={() => setSelectedTab(4)}
          >
            <p>Team Boards</p>
          </div>
          <div
            className={`py-1 px-3 rounded-sm ${
              selectedTab === 5 ? 'bg-white text-zinc-600' : ''
            } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer`}
            onClick={() => setSelectedTab(5)}
          >
            <p>Archives</p>
          </div>
        </div>
        <If condition={!isRetrospective}>
          <div
            className={`text-sm ${'md:flex justify-end md:space-y-0 space-y-5'}`}
          >
            <div
              className={` ${
                collapsed && 'xl:flex xl:space-y-0'
              } 2xl:flex  md:space-x-5 space-y-5 2xl:space-y-0 items-center`}
            >
              <Link href={'/icebreaker'}>
                <button className="flex space-x-2 bg-[#F4F4F5] hover:bg-zinc-50 text-black py-2 px-4 rounded-md">
                  <Image
                    className="w-4 h-4 m-auto"
                    src={icebreaker}
                    alt="icebreaker"
                  ></Image>
                  <p>Start a Ice Breaker Session</p>
                </button>
              </Link>

              <Link href={'/retrospectives/create'}>
                <button className="flex space-x-2 bg-black hover:bg-zinc-700 text-white py-2 px-4 rounded-md">
                  <Image className="m-auto" src={add} alt="add"></Image>
                  <p> Create retrospective</p>
                </button>
              </Link>
            </div>
          </div>
        </If>
      </div>
    </div>
  );
}

export default TopMenuTabs;
