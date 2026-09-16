import { Trans } from 'next-i18next';
import Alert from '~/core/ui/Alert';
import Image from 'next/image';
import search from 'public/assets/svg/magnifying-glass.svg';
import { useState, useEffect } from 'react';
import useSearchTeamMembersRole from '~/lib/server/teams/search-team-members-role';
import LoadingMembersSpinner from '../organizations/LoadingMembersSpinner';

const OrganizationMembersCheckBoxSelector: React.FC<{
  organizationId: string;
  selectedMembers: string[];
  teamId: string;
  setSelectedMembers: (members: string[]) => void;
}> = ({ organizationId, teamId }) => {
  const { data, refetch, loading, error } = useSearchTeamMembersRole(
    organizationId,
    teamId,
    '',
    0,
  );

  const [name, setName] = useState('');
  const [members, setMembers] = useState<any>(data);

  useEffect(() => {
    if (data.length > 0) {
      setMembers(data);
    } else {
      setMembers([]);
    }
  }, [data]);
  if (loading) {
    return <LoadingMembersSpinner />;
  }

  if (error) {
    return (
      <Alert type={'error'}>
        <Trans i18nKey={'organization:loadMembersError'} />
      </Alert>
    );
  }

  return (
    <div>
      <ul className="w-48 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg">
        <li className="w-full border-b border-gray-200 rounded-t-lg">
          <div className="flex items-center pl-3">
            <div className="outline-none flex items-center relative">
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="w-full outline-none px-3 py-2 pl-8"
                placeholder={`Members`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    refetch(name, 0);
                  }
                }}
              ></input>
              <Image
                className="absolute left-2"
                src={search}
                alt="search"
                style={{
                  width: '16px',
                  height: '16px',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </li>
        <div className="p-1">
          {members.length > 0 ? (
            members?.map((member: any, index: number) => {
              return (
                <li key={index} className="w-full rounded-t-lg">
                  <div className="flex items-center pl-3">
                    <input
                      type="checkbox"
                      value=""
                      className="h-4 w-4 rounded accent-black border-gray-300 transition ease-in-out"
                    />
                    <label
                      htmlFor="vue-checkbox"
                      className="text-sm py-1.5 px-2 border-none"
                    >
                      {member.name}
                    </label>
                  </div>
                </li>
              );
            })
          ) : (
            <p className="text-center py-6">Members not found</p>
          )}
        </div>

        <li className="w-full border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              setName('');
              setMembers([]);
            }}
            className="py-2.5 px-3 w-full"
          >
            <p className="text-center">Clear filters</p>
          </button>
        </li>
      </ul>
    </div>
  );
};

export default OrganizationMembersCheckBoxSelector;
