import { useState, useCallback, FormEventHandler } from 'react';
import toaster from 'react-hot-toast';
import { useAuth } from 'reactfire';

import Image from 'next/image';
import { useRouter } from 'next/router';

import arrowLeft from 'public/assets/svg/arrow-left-black.svg';

import useAddTeams from '~/lib/teams/hooks/use-add-teams';
import { AddTeamScreenProps } from '~/lib/teams/types/teams';

export default function AddTeamScreen({
  setAddTeams,
  organizationId,
}: AddTeamScreenProps) {
  const auth = useAuth();
  const user = auth.currentUser;

  const { trigger: addTeams } = useAddTeams();

  const [teamName, setTeamName] = useState('');
  const [errorTeamName, setErrorTeamName] = useState(false);

  const router = useRouter();

  const onCreateTeams: FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event.preventDefault();

      if (teamName !== '' && user) {
        setErrorTeamName(false);
        const body = {
          name: teamName,
          userId: user.uid,
          organization: organizationId,
          email: user.email,
        };

        const promise = addTeams(body)
          .then((res: any) => {
            if (res.success) router.push(`/settings/teams/${res.data}/invite`);
          })
          .catch((e) => {
            console.log('ERROR onCreateActions', e);
          });

        await toaster.promise(promise, {
          loading: 'Creating team',
          success: 'Team created',
          error: 'Error creating team',
        });
      } else {
        if (teamName === '') {
          setErrorTeamName(true);
        } else {
          setErrorTeamName(false);
        }
      }
    },
    [teamName, organizationId, setErrorTeamName, addTeams, router, user],
  );

  return (
    <div className="w-8/12">
      <div className="md:flex space-y-2 md:space-y-0 justify-between">
        <p className="font-semibold">Create New Team</p>
        <div className="flex space-x-2">
          <button
            onClick={() => setAddTeams(false)}
            className="flex bg-[#F4F4F5] px-4 py-2 space-x-2 rounded-md hover:bg-gray-50"
          >
            <Image className="my-auto" src={arrowLeft} alt="arrowLeft"></Image>
            <p className="text-sm">Back to team list</p>
          </button>
        </div>
      </div>
      <form onSubmit={onCreateTeams} className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm">Team Name</p>
          <input
            onChange={(e) => setTeamName(e.target.value)}
            value={teamName}
            className="w-full border border-[#E4E4E7] py-1 px-3 rounded-md"
          ></input>
          <p className="text-xs font-normal text-[#71717A]">
            Create your team name
          </p>
          {errorTeamName && (
            <p className="text-red-500">Please fill out team name input</p>
          )}
        </div>
        <div className="flex space-x-8 justify-end">
          <button
            type="submit"
            className="text-sm bg-black text-white px-4 py-2 rounded-md"
          >
            Create Team
          </button>
        </div>
      </form>
    </div>
  );
}
