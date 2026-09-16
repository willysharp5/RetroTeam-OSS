import Selector from '~/components/shared/selector';

import { Structure } from '~/lib/structures/types/structures';
import { Access } from '~/lib/access/types/access';

import user from 'public/assets/svg/user.svg';
import eye from 'public/assets/svg/eye-closed.svg';
import users from 'public/assets/svg/users.svg';

interface Props {
  boardTitle: string;
  setBoardTitle: React.Dispatch<React.SetStateAction<string>>;
  structure: Structure[];
  useIcebreaker: boolean;
  setUseIcebreaker: React.Dispatch<React.SetStateAction<boolean>>;
  access: Access;
  setAccess: React.Dispatch<React.SetStateAction<Access>>;
  handleCreateRetrospective: () => void;
}

const options = [
  {
    title: 'public',
    description: 'Anyone with a link can view.',
    icon: user,
  },
  {
    title: 'private',
    description:
      'Anyone with a link will need access from the facilitator to view your retro',
    icon: eye,
  },
  {
    title: 'team',
    description: 'Only team members can view.',
    icon: users,
  },
];

export const AddRetrospective = ({
  boardTitle,
  setBoardTitle,
  structure,
  useIcebreaker,
  setUseIcebreaker,
  access,
  setAccess,
  handleCreateRetrospective,
}: Props) => {
  return (
    <>
      <div className="text-sm text-black mt-12 border rounded-md p-6">
        <p>Board Name</p>
        <textarea
          onChange={(e) => setBoardTitle(e.target.value)}
          value={boardTitle}
          className="border mt-2 w-full py-2 px-3 h-20 rounded-md text-sm text-zinc-800"
          placeholder="Enter your action description"
        ></textarea>
      </div>
      <div className="text-sm text-black mt-4 border rounded-md p-6">
        <>
          <h5 className="font-semibold text-lg mb-4">Structure</h5>
          <div className="space-y-6">
            {structure.map((entry: any, index) => {
              return (
                <div key={index}>
                  <p className="font-medium">{entry.name}</p>
                  <p className="text-zinc-500">{entry.description}</p>
                </div>
              );
            })}
          </div>
        </>
      </div>
      <div className="text-sm text-black mt-4 border rounded-md p-6">
        <h5 className="font-semibold text-lg">Start with an icebreaker</h5>
        <div className="flex flex-nowrap items-center">
          <p className="text-zinc-500">
            Use one of our many fun questions available to help your team
            members connect!
          </p>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setUseIcebreaker(true);
                  } else {
                    setUseIcebreaker(false);
                  }
                }}
                checked={useIcebreaker}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none  rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>
        </div>
      </div>
      <div className="text-sm text-black mt-4 border rounded-md p-6">
        <h5 className="font-semibold text-lg">Access</h5>
        <p className="text-zinc-500 mb-6">
          Choose how your retrospectives are seen by members.
        </p>
        <Selector
          options={options}
          setOption={setAccess}
          selectedOption={access}
        />
      </div>
      <button
        onClick={handleCreateRetrospective}
        className="flex w-full justify-center mt-6 bg-orange-500 hover:bg-orange-400 text-white py-2 px-4 rounded-md"
      >
        <span> Start Retrospective</span>
      </button>
    </>
  );
};
