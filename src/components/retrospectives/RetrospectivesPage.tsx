import { useState } from 'react';

import { CreateRetrospectiveComponent } from './CreateRetrospectiveComponent';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { useCurrentTeam } from '~/lib/organizations/hooks/use-current-team';
import { useGetRetrospectives } from '~/lib/retrospectives/hooks/use-get-retrospectives';

import { TemplatesComponent } from './Templastes';
import Link from 'next/link';

import add from 'public/assets/svg/plus-circled.svg';
import icebreaker from 'public/assets/svg/ice-cream.svg';
import search from 'public/assets/svg/magnifying-glass.svg';

import Image from 'next/image';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';

const DEFAULT_ROWS = 1;

export default function RetrospectivesPage() {
  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  const { team } = useCurrentTeam();
  const teamId = team?.id as string;

  const router = useRouter();

  const [rowsPerPage] = useState(DEFAULT_ROWS);

  const { fetchRetrospectives } = useGetRetrospectives(
    organizationId,
    teamId,
    rowsPerPage === 1 ? rowsPerPage + 1 : rowsPerPage + 3,
  );

  const createRetrospectiveHandler = () => {
    router.push('/retrospectives/create');
  };

  return (
    <div className={'flex flex-col space-y-6 pb-36'}>
      <div className="w-full justify-end  px-8 tv:px-36 pt-6 md:flex md:space-x-5 space-y-5 md:space-y-0 items-center">
        <Link href={'/search/retrospectives'}>
          <button className="flex space-x-2 bg-[#F4F4F5] hover:bg-zinc-50 text-black py-2 px-4 rounded-md">
            <Image className="w-4 h-4 m-auto" src={search} alt="search"></Image>
            <p>Search Retrospectives</p>
          </button>
        </Link>
        <Link href={'/icebreaker'}>
          <button
            onClick={() => Cookies.remove('startBoard')}
            className="flex space-x-2 bg-[#F4F4F5] hover:bg-zinc-50 text-black py-2 px-4 rounded-md"
          >
            <Image
              className="w-4 h-4 m-auto"
              src={icebreaker}
              alt="icebreaker"
            ></Image>
            <p>Start a Ice Breaker Session</p>
          </button>
        </Link>

        <button
          onClick={createRetrospectiveHandler}
          className="flex space-x-2 bg-black hover:bg-zinc-700 text-white py-2 px-4 rounded-md"
        >
          <Image className="m-auto" src={add} alt="add"></Image>
          <p> Create retrospective</p>
        </button>
      </div>
      <CreateRetrospectiveComponent
        onCreateRetrospective={() => fetchRetrospectives(1)}
      />

      <TemplatesComponent onCreateRetrospective={() => fetchRetrospectives(1)} />
    </div>
  );
}
