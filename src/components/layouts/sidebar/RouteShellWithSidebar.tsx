import { useEffect } from 'react';

import { isBrowser } from '~/core/generic/is-browser';
import AppHeaderNoMenu from './AppHeaderNoMenu';
import Heading from '~/core/ui/Heading';
import AppSidebar from './AppSidebar';
import TeamsSidebar from './TeamsSidebar';

const RouteShellWithSidebar: React.FCC<{
  title: string;
}> = ({ title, children }) => {
  useDisableBodyScrolling();
  return (
    <div
      id="screen"
      className={`${
        title !== 'Board' ? 'overflow-y-auto' : 'md:bg-white bg-gray-100'
      } relative mx-auto h-screen w-full  flex flex-col`}
    >
      {title !== 'Board' && title !== 'Icebreaker' && title !== 'Results' ? (
        <AppHeaderNoMenu>
          <div className={'w-full'}>
            <Heading type={5}>
              <span className={'font-medium'}>{title}</span>
            </Heading>
          </div>
        </AppHeaderNoMenu>
      ) : (
        title === 'Board' ||
        title === 'Icebreaker' ||
        (title === 'Results' && <></>)
      )}
      <div
        className={
          title === 'Board' ||
          title === 'Actions' ||
          title === 'Analytics' ||
          title === 'Icebreaker'
            ? `md:flex flex-1 w-screen ${
                title !== 'Icebreaker' && 'max-w-[2100px]'
              } self-center overflow-hidden overflow-y-auto md:overflow-x-scroll 2xl:overflow-y-hidden`
            : `md:flex flex-1 overflow-auto w-screen max-w-[2100px] self-center`
        }
      >
        <div className={'hidden lg:flex w-min'}>
          {title !== 'Teams' &&
          title !== 'Team Details' &&
          title != 'Board' &&
          title !== 'Icebreaker' &&
          title !== 'Results' ? (
            <AppSidebar />
          ) : (
            (title === 'Teams' || title === 'Team Details') && <TeamsSidebar />
          )}
        </div>
        <div
          id="screen"
          className={
            title === 'Board'
              ? 'px-0 py-0 flex flex-col flex-1 bg-gray-100'
              : title === 'Actions' ||
                title === 'Icebreaker' ||
                title === 'Dashboard' ||
                title === 'Retrospective' ||
                title === 'Create new retrospective'
              ? 'px-0 py-0 flex flex-col flex-1'
              : title === 'Analytics'
              ? `flex flex-col flex-1 overflow-auto bg-gray-100`
              : title === 'Settings' || title === 'Integration'
              ? `flex-col flex-1 overflow-auto bg-gray-100 h-full`
              : title === 'SearchActions' || title === 'SearchRetrospectives'
              ? `flex flex-col flex-1 overflow-auto`
              : `px-8 py-6 tv:px-36 flex flex-col flex-1 overflow-auto`
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default RouteShellWithSidebar;

function useDisableBodyScrolling() {
  useEffect(() => {
    if (!isBrowser()) {
      return;
    }

    document.body.style.setProperty('overflow', 'hidden');

    return () => {
      document.body.style.removeProperty('overflow');
    };
  }, []);
}
