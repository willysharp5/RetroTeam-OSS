import Head from 'next/head';
import dynamic from 'next/dynamic';

import configuration from '~/configuration';
import { LayoutStyle } from '~/core/layout-style';
import Layout from '~/core/ui/Layout';
import AppHeaderNoMenu from './layouts/sidebar/AppHeaderNoMenu';
import Heading from '~/core/ui/Heading';

const ReactHotToast = dynamic(async () => {
  const { Toaster } = await import('react-hot-toast');

  return Toaster;
});

const FirebaseFirestoreProvider = dynamic(
  () => import('~/core/firebase/components/FirebaseFirestoreProvider'),
);

const GuardedPage = dynamic(
  () => import('~/core/firebase/components/GuardedPage'),
);

const redirectPathWhenSignedOut = '/';

const RouteShellNoSideBar: React.FCC<{
  title: string;
  style?: LayoutStyle;
}> = ({ title, style, children }) => {
  const layout = style ?? configuration.navigation.style;

  return (
    <FirebaseFirestoreProvider>
      <Head>
        <title key="title">{title}</title>
      </Head>

      <GuardedPage whenSignedOut={redirectPathWhenSignedOut}>
        <Layout>
            <ReactHotToast />

            <div
              id="screen"
              className={`${
                title !== 'Board'
                  ? 'overflow-y-auto'
                  : 'md:bg-white bg-gray-100'
              } relative mx-auto h-screen w-full  flex flex-col`}
            >
              {title !== 'Board' &&
              title !== 'Icebreaker' &&
              title !== 'Results' ? (
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
                  title === 'SearchRetrospectives' ||
                  title === 'Icebreaker'
                    ? 'md:flex flex-1 w-screen max-w-[2100px] self-center overflow-hidden overflow-y-auto md:overflow-x-scroll xl:overflow-y-hidden'
                    : `md:flex flex-1 overflow-auto w-screen max-w-[2100px] self-center`
                }
              >
                <div
                  id="screen"
                  className={
                    title === 'Board' ||
                    title === 'Actions' ||
                    title === 'Icebreaker' ||
                    title === 'Dashboard' ||
                    title === 'Retrospective' ||
                    title === 'Create new retrospective'
                      ? 'px-0 py-0 flex flex-col flex-1'
                      : title === 'Analytics' ||
                        title === 'SearchRetrospectives'
                      ? `flex flex-col flex-1 overflow-auto bg-gray-100`
                      : title === 'Settings' || title === 'Integration'
                      ? `flex-col flex-1 overflow-auto bg-gray-100 h-full`
                      : `px-8 py-6 tv:px-36 flex flex-col flex-1 overflow-auto`
                  }
                >
                  {children}
                </div>
              </div>
            </div>
        </Layout>
      </GuardedPage>
    </FirebaseFirestoreProvider>
  );
};

export default RouteShellNoSideBar;
