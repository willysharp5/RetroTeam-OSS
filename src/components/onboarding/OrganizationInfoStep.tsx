import { useUser } from 'reactfire';
import { FormEvent, useCallback, useState, useEffect, useMemo } from 'react';
import { useAuth } from 'reactfire';
import Button from '~/core/ui/Button';
import TextField from '~/core/ui/TextField';
import getRandomName from 'src/constants/Names';
import useFetchUserById from '~/lib/server/user/get-current-user';
export interface OrganizationInfoStepData {
  organization: string;
  teams: object;
  name: string;
  lastName: string;
  email: string;
}

export const OrganizationInfoStep: React.FCC<{
  onSubmit: (data: OrganizationInfoStepData) => void;
  nextStep: number;
  setNextStep: (step: number) => void;
}> = ({ onSubmit, nextStep, setNextStep }) => {
  const { data } = useUser();
  const auth = useAuth();
  const user = auth.currentUser;
  const userId = user?.uid as string;

  const userData = useFetchUserById(userId);
  const fullOrganizationName = useMemo(() => getRandomName(), []);
  const [randomOrganization, randomTeam] = fullOrganizationName.split(' ');

  const [organizationInput, setOrganizationInput] = useState('');
  const [teamInput, setTeamInput] = useState('');
  // const displayName = data?.displayName ?? data?.email ?? '';
  const fullName = useMemo(() => getRandomName(), []);
  const [randomName, randomName2] = fullName.split(' ');

  const [nameInput, setNameInput] = useState('');
  const [lastName, setLastNameInput] = useState('');

  const [OrganizationErrorMessage, setOrganizationErrorMessage] = useState('');
  const [TeamErrorMessage, setTeamErrorMessage] = useState('');
  const [NameErrorMessage, setNameErrorMessage] = useState('');
  const [LastErrorMessage, setLastErrorMessage] = useState('');

  useEffect(() => {
    if (user?.isAnonymous) {
      setOrganizationInput(randomOrganization);
      setTeamInput(randomTeam);
      setNameInput(randomName);
      setLastNameInput(randomName2);
      setNextStep(2);
    } else {
      if (user?.displayName) {
        const nameParts = user?.displayName.split(' ');

        setNameInput(nameParts[0]);
        setLastNameInput(nameParts[1]);
      }
    }
  }, [user]);

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const name = data.get(`name`) as string;
      const lastName = data.get(`lastName`) as string;

      if (name !== '') {
        setNameErrorMessage('');
      } else {
        setNameErrorMessage('Please fill out Name field');
      }

      if (lastName !== '') {
        setLastErrorMessage('');
      } else {
        setLastErrorMessage('Please fill out Last name field');
      }

      if (name !== '' && lastName !== '') {
        onSubmit({
          organization: organizationInput,
          teams: { name: teamInput },
          name: name,
          lastName: lastName,
          email: user?.email || '',
        });
      }
    },
    [onSubmit, organizationInput, teamInput, user],
  );

  const setNext = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const organization = data.get(`organization`) as string;
      const team = data.get(`team`) as string;

      if (organization !== '') {
        setOrganizationErrorMessage('');
      } else {
        setOrganizationErrorMessage('Please fill out Organization field');
      }

      if (team !== '') {
        setTeamErrorMessage('');
      } else {
        setTeamErrorMessage('Please fill out Team field');
      }

      if (organization !== '' && team !== '') {
        if (!userData?.name) {
          setOrganizationInput(organization);
          setTeamInput(team);
          setNextStep(2);
        } else {
          onSubmit({
            organization: organization,
            teams: { name: team },
            name: userData.name,
            lastName: userData.lastName,
            email: userData?.email || '',
          });
        }
      }
    },
    [userData, onSubmit, setNextStep],
  );

  return (
    <div className="md:mx-0 mx-6">
      {nextStep === 1 ? (
        <form
          onSubmit={setNext}
          className={'flex w-full flex-1 flex-col space-y-6'}
        >
          <div
            className={
              'flex flex-col space-y-1.5  pb-6 border-b border-[#E4E4E7]'
            }
          >
            <h1 className="text-lg font-medium">Why?</h1>
            <p className="text-sm text-zinc-500">
              Your organization name helps you connect all your teams under a
              single entity.{' '}
            </p>
          </div>

          <div className={'flex flex-1 flex-col space-y-8'}>
            <div>
              <TextField>
                <TextField.Label>
                  Organization name
                  <TextField.Input
                    name={'organization'}
                    placeholder={randomOrganization}
                  />
                </TextField.Label>
              </TextField>
              <p className="mt-2 text-sm text-red-500">
                {' '}
                {OrganizationErrorMessage}
              </p>
            </div>

            <div>
              <TextField>
                <TextField.Label>
                  Team name
                  <TextField.Input name={'team'} placeholder={randomTeam} />
                </TextField.Label>
              </TextField>
              <p className="mt-2 text-sm text-red-500"> {TeamErrorMessage}</p>
            </div>

            <div>
              <Button type={'submit'} color={'secondary'}>
                <span className={'flex items-center space-x-2'}>
                  <span>Set account</span>
                </span>
              </Button>
            </div>
          </div>
        </form>
      ) : (
        nextStep === 2 && (
          <form
            onSubmit={handleFormSubmit}
            className={'flex w-full flex-1 flex-col space-y-6'}
          >
            <div className={'flex flex-1 flex-col space-y-8'}>
              <div>
                <TextField>
                  <TextField.Label>
                    First Name
                    <TextField.Input
                      name={'name'}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNameInput(e.target.value)
                      }
                      placeholder={randomName}
                      value={nameInput}
                    />
                  </TextField.Label>
                  <p className="text-xs text-zinc-500">
                    Choose a name by which you will be recognized
                  </p>
                </TextField>
                <p className="mt-3 text-sm text-red-500"> {NameErrorMessage}</p>
              </div>
              <div>
                <TextField>
                  <TextField.Label>
                    Last Name
                    <TextField.Input
                      name={'lastName'}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLastNameInput(e.target.value)
                      }
                      placeholder={randomName2}
                      value={lastName}
                    />
                  </TextField.Label>
                  <p className="text-xs text-zinc-500">
                    Choose a name by which you will be recognized
                  </p>
                </TextField>
                <p className="mt-3 text-sm text-red-500"> {LastErrorMessage}</p>
              </div>

              <div>
                <Button type={'submit'} color={'secondary'}>
                  <span className={'flex items-center space-x-2'}>
                    <span>Join</span>
                  </span>
                </Button>
              </div>
            </div>
          </form>
        )
      )}
    </div>
  );
};
