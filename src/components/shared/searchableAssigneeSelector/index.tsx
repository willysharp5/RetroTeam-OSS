import Image from 'next/image';
import plus from 'public/assets/svg/plus.svg';
import { Fragment, useCallback, useEffect, useState } from 'react';
import UserImage from '~/components/dashboard/UserImage';
import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '~/core/ui/Dropdown';
import If from '~/core/ui/If';
import { TeamMembers } from '~/lib/teams/types/teams';
import useFetchUserById from '~/lib/users/hooks/use-get-user-by-id';

interface SearchableAssigneSelectorProps {
  label: string;
  selectedVal: any;
  handleChange: (item: any) => void;
  refetch: any;
  type?: string;
  organizationId: string;
  loading: boolean;
  options: TeamMembers[] | any[] | null;
}

const SearchableAssigneSelector = ({
  options = [],
  label,
  selectedVal,
  handleChange,
  refetch,
  type,
  organizationId,
  loading,
}: SearchableAssigneSelectorProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loadingUser, setLoading] = useState(true);

  const { trigger: getUserById } = useFetchUserById();

  const [user, setUser] = useState<any>();

  const onGetUserInfo = useCallback(async () => {
    try {
      const body = {
        userId: selectedVal,
      };
      getUserById(body)
        .then((res: any) => {
          if (res.success) {
            setUser(res.data);
            setLoading(false);
          }
        })
        .catch((e) => {
          console.error('ERROR onGetUserInfo', e);
          setLoading(false);
        });
    } catch {}
  }, [getUserById, selectedVal]);

  useEffect(() => {
    if (selectedVal && selectedVal != '') onGetUserInfo();
  }, [selectedVal]);

  const selectOption = (option: any) => {
    setQuery('');
    handleChange(option.id);
    setIsOpen(!isOpen);
    refetch('');
  };

  const getDisplayValue = () => {
    if (query === '') {
      return '';
    }
    if (query) return query;

    return '';
  };

    const userValue = user?.[label];
  const name = userValue?.trim() !== '' ? userValue : user?.email ?? '';

  return (
    <DropdownMenu
      onOpenChange={(e) => {
        refetch(3);
        setIsOpen(e);
      }}
    >
      <div className="relative ">
        <DropdownMenuTrigger style={{ outline: 'none' }}>
          {!selectedVal ? (
            <div className="relative">
              <div className="flex items-center">
                <div className="bg-black rounded-full p-1 h-6 w-6">
                  <Image src={plus} alt="plus" />
                </div>
                <p className="ml-4 text-[#71717A] text-xs">Assignee</p>
              </div>
              <div
                className={`arrow absolute right-10 top-14 w-0 h-0 border-5 border-transparent border-solid border-999 ${
                  isOpen
                    ? 'border-0  border-5 border-solid border-transparent border-transparent-999'
                    : ''
                }`}
              ></div>
            </div>
          ) : (
            <Fragment>
              {!loadingUser ? (
                <div className="relative">
                  <div className="flex items-center w-full">
                    <UserImage
                      organizationId={organizationId}
                      selectedMember={selectedVal}
                    />
                    <p className="ml-2 max-w-[80px] overflow-hidden text-left truncate text-xs">
                      {name}
                    </p>
                  </div>
                  <div
                    className={`arrow absolute right-10 top-14 w-0 h-0 border-5 border-transparent border-solid border-999 ${
                      isOpen
                        ? 'border-0  border-5 border-solid border-transparent border-transparent-999'
                        : ''
                    }`}
                  ></div>
                </div>
              ) : (
                <LoadingMembersSpinner />
              )}
            </Fragment>
          )}
        </DropdownMenuTrigger>
        <If condition={isOpen}>
          {' '}
          <DropdownMenuContent style={{ marginLeft: 50 }}>
            <input
              type="text"
              placeholder="Type Member Name"
              value={getDisplayValue()}
              name="searchTerm"
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.length >= 3) {
                  refetch(e.target.value);
                } else if (e.target.value === '') {
                  refetch('');
                  setQuery(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  refetch(query, type);
                }
              }}
              className="text-[#71717A] text-xs w-full py-2 px-2 focus:border-none bg-transparent rounded-lg outline-none transition duration-200 ease-in-out"
            />
            <div
              className={`options top-full w-full z-10 bg-white overflow-y-auto max-h-[150px] block`}
            >
              {loading ? (
                <div className="ml-2">
                  <LoadingMembersSpinner />
                </div>
              ) : (
                options &&
                options?.length > 0 &&
                options?.map((option: any, index: number) => (
                  <Option
                    key={'option' + option.id + index}
                    option={option}
                    index={index}
                    selectOption={selectOption}
                    selectedValue={selectedVal}
                    organizationId={organizationId}
                    label={label}
                  />
                ))
              )}
            </div>
          </DropdownMenuContent>
        </If>
      </div>
    </DropdownMenu>
  );
};

const Option = ({
  option,
  index,
  selectOption,
  selectedValue,
  organizationId,
  label,
}: any) => {
  const { trigger: getUserById } = useFetchUserById();

  const [user, setUser] = useState<any>();
  const [loadingUser, setLoading] = useState(true);

  const onGetUserInfo = useCallback(async () => {
    try {
      const body = {
        userId: option.id,
      };
      getUserById(body)
        .then((res: any) => {
          if (res.success) {
            setUser(res.data);
            setLoading(false);
          }
        })
        .catch((e) => {
          console.error('ERROR onGetUserInfo', e);
          setLoading(false);
        });
    } catch {}
  }, [getUserById, option]);

  useEffect(() => {
    if (option?.id) {
      onGetUserInfo();
    }
  }, [option]);

  const userValue = user?.[label];
  const name = userValue?.trim() !== '' ? userValue : user?.email ?? '';

  return (
    <Fragment>
      {!loadingUser ? (
        <div className={'cursor-pointer'}>
          <div
            onClick={() => {
              selectOption(option);
            }}
            className={`option py-1 px-2 cursor-pointer${
              option.id === selectedValue ? 'selected bg-[#f2f9fc]' : ''
            }`}
            key={`${option.id}-${index}`}
          >
            <div className="flex my-auto flex-auto items-center space-x-2">
              <UserImage
                organizationId={organizationId}
                selectedMember={option.id}
              />
              <div className={'block truncate text-sm'}>{name}</div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <LoadingMembersSpinner />
        </div>
      )}
    </Fragment>
  );
};

export default SearchableAssigneSelector;
