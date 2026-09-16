import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';

import { withAppProps } from '~/lib/props/with-app-props';
import SettingsPageContainer from '~/components/settings/SettingsPageContainer';
import SettingsContentContainer from '~/components/settings/SettingsContentContainer';
import TeamsSettingsTabs from '~/components/teams/TeamSettingsTabs';
import dynamic from 'next/dynamic';

const Teams = () => {
  const TeamsPage = dynamic(() => import('~/components/teams/TeamsPage'), {
    ssr: false,
  });

  return (
    <>
      <div id="overlay"></div>
      <div id="teams"></div>
      <SettingsPageContainer title={'Settings'}>
        <Head>
          <title key="title">Teams Settings</title>
        </Head>

        <TeamsSettingsTabs />

        <SettingsContentContainer>
          <TeamsPage />
        </SettingsContentContainer>
      </SettingsPageContainer>
    </>
  );
};

export default Teams;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAppProps(ctx);
}
