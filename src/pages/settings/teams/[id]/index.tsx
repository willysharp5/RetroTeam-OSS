import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';

import { withAppProps } from '~/lib/props/with-app-props';
import SettingsPageContainer from '~/components/settings/SettingsPageContainer';
import SettingsContentContainer from '~/components/settings/SettingsContentContainer';
import TeamsSettingsTabs from '~/components/teams/TeamSettingsTabs';
import dynamic from 'next/dynamic';
import { withTeamProps } from '~/lib/props/with-team-props';

const Teams = () => {
  const TeamDetailsPage = dynamic(
    () => import('~/components/teams/TeamDetailsPage'),
    {
      ssr: false,
    },
  );

  return (
    <>
      <div id="overlay"></div>
      <div id="team-details"></div>
      <SettingsPageContainer title={'Settings'}>
        <Head>
          <title key="title">Team Details</title>
        </Head>

        <TeamsSettingsTabs />

        <SettingsContentContainer>
          <TeamDetailsPage />
        </SettingsContentContainer>
      </SettingsPageContainer>
    </>
  );
};

export default Teams;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withTeamProps(ctx);
}
