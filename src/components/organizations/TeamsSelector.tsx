import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectSeparator,
  SelectGroup,
  SelectLabel,
  SelectValue,
} from '~/core/ui/SelectTeam';

import ClientOnly from '~/core/ui/ClientOnly';
import { Teams } from '~/lib/teams/types/teams';
import { useCurrentTeam } from '~/lib/organizations/hooks/use-current-team';
import useFetchAvailableTeams from '~/lib/server/teams/get-available-teams';

const TeamsSelector: React.FCC<{ userId: string }> = ({ userId }) => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const router = useRouter();
  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;
  const { team, setTeam } = useCurrentTeam();

  const { data: availableTeamData, loading } = useFetchAvailableTeams(
    organizationId,
    userId,
  );

  const value = getDeepLinkPath(team?.id as string, organizationId);

  const [data, setData] = useState(availableTeamData);

  useEffect(() => {
    if (availableTeamData) {
      if (availableTeamData.length > 0) {
        setData(availableTeamData);
      } else {
        setTeam(null)
      }
      if (team) {
        const isPartOfTeam = availableTeamData?.find(
          (item) => item.id === team.id,
        );
        if (!isPartOfTeam) {
          const path = getDeepLinkPath(
            availableTeamData[0]?.id as string,
            organizationId,
          );
          if (availableTeamData[0]?.organizationId === organizationId)
            router.push(path);
        }
      }
    }
  }, [availableTeamData, team, organizationId]);

  if (!hydrated) {
    return null;
  }

  return (
    <>
      {team && (
        <>
          <Select
            open={isSelectOpen}
            onOpenChange={setIsSelectOpen}
            value={value}
            onValueChange={(path) => {
              return router.push(path);
            }}
          >
            <SelectTrigger
              data-cy={'organization-selector'}
              className={'!bg-transparent !h-9 w-full'}
            >
              <span
                className={
                  'min-w-[5rem] block text-sm lg:max-w-[12rem] lg:text-base'
                }
              >
                <TeamItem team={team} />

                <span hidden>
                  <SelectValue />
                </span>
              </span>
            </SelectTrigger>

            <SelectContent position={'popper'}>
              <SelectGroup>
                <SelectLabel>Your Teams</SelectLabel>

                <SelectSeparator />

                <ClientOnly>
                  <TeamsOptions
                    teams={data}
                    userId={userId}
                    organization={organization}
                  />
                </ClientOnly>
              </SelectGroup>

              <SelectGroup></SelectGroup>
            </SelectContent>
          </Select>
        </>
      )}
    </>
  );
};

function TeamsOptions({
  teams,
  organization,
}: React.PropsWithChildren<{
  userId: string;
  teams: Teams[] | any;
  organization: any;
}>) {
  return (
    <>
      {teams?.map((item: Teams) => {
        const path = getDeepLinkPath(item.id, organization.id);

        return (
          <SelectItem value={path} key={item.id}>
            <TeamItem team={item} />
          </SelectItem>
        );
      })}
    </>
  );
}

function TeamItem({ team }: { team: Maybe<Teams> }) {
  if (!team) {
    return null;
  }

  const { name } = team;

  return (
    <span
      data-cy={'organization-selector-item'}
      className={`flex max-w-[12rem] items-center space-x-2`}
    >
      <span className={'w-auto truncate text-sm font-medium'}>{name}</span>
    </span>
  );
}

function getDeepLinkPath(teamId: string, organizationId: string) {
  return ['', 'teams', teamId, organizationId, 'update'].join('/');
}

export default TeamsSelector;
