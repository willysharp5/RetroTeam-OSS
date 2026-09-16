import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';

import { withAppProps } from '~/lib/props/with-app-props';
import SettingsPageContainer from '~/components/settings/SettingsPageContainer';
import SettingsContentContainer from '~/components/settings/SettingsContentContainer';
import TeamsSettingsTabs from '~/components/teams/TeamSettingsTabs';
import dynamic from 'next/dynamic';

const Teams = () => {
  const TeamInvitePage = dynamic(
    () => import('~/components/teams/InviteMember'),
    {
      ssr: false,
    },
  );

  return (
    <SettingsPageContainer title={'Settings'}>
      <Head>
        <title key="title">Teams Invite</title>
      </Head>

      <TeamsSettingsTabs />

      <SettingsContentContainer>
        <TeamInvitePage />
      </SettingsContentContainer>
    </SettingsPageContainer>
  );
};

export default Teams;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAppProps(ctx);
}
