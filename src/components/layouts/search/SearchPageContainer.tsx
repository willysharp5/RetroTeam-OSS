import React from 'react';
import Image from 'next/image';
import settings from 'public/assets/svg/settings.svg';
import RouteShellNoSidebar from '~/components/RouteShellNoSideBar';
import FirebaseFirestoreProvider from '~/core/firebase/components/FirebaseFirestoreProvider';
import Layout from '~/core/ui/Layout';
import GuardedPage from '~/core/firebase/components/GuardedPage';
const SearchPageContainer: React.FCC<{
  title: string;
}> = ({ children, title }) => {
  const redirectPathWhenSignedOut = '/';
  return (
    <FirebaseFirestoreProvider>
      <GuardedPage whenSignedOut={redirectPathWhenSignedOut}>
        <Layout>
          <RouteShellNoSidebar title={title}>
              <div className="md:flex items-center justify-between border-b pb-2 border-gray-100 px-8 py-6 pb-0 tv:px-36 bg-white">
                <div className={'flex items-center space-y-2 '}>
                  <div className="space-y-5">
                    <p className="text-3xl font-semibold">Settings</p>
                    <div className="flex space-x-5 items-center">
                      <Image src={settings} alt="settings"></Image>
                      <p className="text-[#71717A] text-sm">
                        Manage all your settings here
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-100 px-8 py-6 pb-0 tv:px-36">
                <div
                  className={`bg-white flex h-full flex-col space-y-4 lg:flex-row max-h-[500px]'}`}
                >
                  {children}
                </div>
              </div>
          </RouteShellNoSidebar>
        </Layout>
      </GuardedPage>
    </FirebaseFirestoreProvider>
  );
};

export default SearchPageContainer;
