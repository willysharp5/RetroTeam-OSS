import { useEffect, useRef, useState, useMemo } from 'react';

import LoadingMembersSpinner from '../organizations/LoadingMembersSpinner';
import { ChevronUpDownIcon, XCircleIcon } from '@heroicons/react/24/outline';
import If from '~/core/ui/If';
import UserImage from '../dashboard/UserImage';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';

const SearchableDropdown = ({
  options,
  label,
  id,
  selectedVal,
  handleChange,
  refetch,
  loading,
  hasAllMembers = true,
  resetInput = false,
}: any) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen);
  };

  const selectOption = (option: any) => {
    setQuery('');
    setIsTyping(false);
    handleChange(option);
    setIsOpen(false);
  };

  const displayValue = useMemo(() => {
    if (query !== '') return query;
    if (query === '') return '';
    if (typeof selectedVal === 'string' && selectedVal != '')
      return 'Any member';
    return selectedVal ? selectedVal.displayName : '';
  }, [query, selectedVal]);

  useEffect(() => {
    if (resetInput) {
      setQuery('');
    }
  }, [resetInput]);

  return (
    <div
      ref={dropdownRef}
      className="relative text-gray-700 cursor-default dropdown"
    >
      <div
        className="flex h-10 w-full items-center justify-between
          rounded-md border border-[#E4E4E7] bg-white py-1.5 px-2.5 md:py-2 md:px-4 ring-offset-1 transition-all
          duration-300 placeholder:text-gray-400
          disabled:cursor-not-allowed
          disabled:opacity-50"
        onClick={toggleDropdown}
      >
        {selectedVal && !isTyping && (
          <UserImage
            organizationId={organizationId}
            selectedMember={selectedVal.id}
          />
        )}
        <input
          type="text"
          placeholder="Type Member Name"
          value={displayValue}
          name="searchTerm"
          onChange={(e) => {
            setIsTyping(true);
            setIsOpen(true);
            setQuery(e.target.value);
            if (e.target.value.length >= 3) {
              refetch(e.target.value);
            } else {
              refetch('');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              refetch(query);
              setIsOpen(true);
              if (query === '') {
                selectOption('');
              }
            }
          }}
          className="ml-2 border-none outline-none bg-transparent"
        />
        {selectedVal && !isTyping && (
          <button
            onClick={() => {
              selectOption('');
              refetch('');
            }}
          >
            <XCircleIcon className={'h-4'} />
          </button>
        )}

        <ChevronUpDownIcon className={'h-4'} />
      </div>

      <div className="relative">
        <div
          className={`arrow absolute right-10 top-14 w-0 h-0 border-5 border-transparent border-solid border-999 ${
            isOpen
              ? 'border-0  border-5 border-solid border-transparent border-transparent-999'
              : ''
          }`}
        ></div>
        <div
          className={`arrow absolute right-10 top-14 w-0 h-0 border-5 border-transparent border-solid border-999 ${
            isOpen
              ? 'border-0  border-5 border-solid border-transparent border-transparent-999'
              : ''
          }`}
        ></div>
      </div>

      <div
        className={`options absolute top-full w-full z-10 bg-white border border-ccc shadow-lg rounded-md mt-2 overflow-y-auto max-h-200 ${
          isOpen ? 'block' : 'hidden'
        }`}
      >
        <If condition={hasAllMembers}>
          <div
            onClick={() => {
              selectOption('Any member'), setQuery('All Members');
            }}
            className={`option py-2 px-2 cursor-pointer ${
              'Any member' === selectedVal || isOpen ? 'selected bg-f2f9fc' : ''
            }`}
            key={`Any member`}
          >
            All Members
          </div>
        </If>

        {loading ? (
          <div className="ml-2">
            <LoadingMembersSpinner />
          </div>
        ) : (
          <div className="max-h-[150px] overflow-y-auto">
            {options &&
              options.map((option: any, index: number) => (
                <div
                  onClick={() => {
                    selectOption(option), setQuery(option[label]);
                  }}
                  className={`option py-2 px-2 cursor-pointer ${
                    option[label] === selectedVal || isOpen
                      ? 'selected bg-f2f9fc'
                      : ''
                  }`}
                  key={`${id}-${index}`}
                >
                  <div className="flex flex-auto items-center space-x-2">
                    <UserImage
                      organizationId={organizationId}
                      selectedMember={option.id}
                    />

                    <div className={'block truncate text-sm'}>
                      {option[label]}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableDropdown;
