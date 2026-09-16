import { useEffect, useRef, useState, useMemo } from 'react';
import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';
import { ChevronUpDownIcon, XCircleIcon } from '@heroicons/react/24/outline';

const FilterDropdown = ({
  options,
  label,
  id,
  selectedVal,
  handleChange,
  onClear,
  loading,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [selectedValue, setSelectedValue] = useState('');

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
    handleChange(option);
    setSelectedValue(option.label);
    setIsOpen(false);
  };

  const displayValue = useMemo(() => {
    return selectedVal ? selectedVal.displayName : '';
  }, [selectedVal]);

  useEffect(() => {
    console.log(selectedVal);
  }, [selectedVal]);

  return (
    <div
      ref={dropdownRef}
      className="relative w-44 text-gray-700 cursor-default dropdown"
    >
      <div
        className="flex h-10 w-44 items-center justify-between text-sm
          rounded-md border border-[#E4E4E7] bg-white py-1.5 px-2.5 md:py-2 md:px-4 ring-offset-1 transition-all
          duration-300 placeholder:text-gray-400
          disabled:cursor-not-allowed
          disabled:opacity-50"
        onClick={toggleDropdown}
      >
        <div className="ml-2 border-none outline-none bg-transparent">
          {selectedValue || label}
        </div>
        {selectedValue !== '' && (
          <button
            onClick={() => {
              setSelectedValue('');
              onClear(id);
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
        {loading ? (
          <div className="ml-2">
            <LoadingMembersSpinner />
          </div>
        ) : (
          <div className="max-h-[150px] overflow-y-auto">
            {options.map((option: any, index: number) => (
              <div
                onClick={() => {
                  selectOption(option);
                }}
                className={`option py-2 px-2 cursor-pointer ${
                  option[label] === selectedVal || isOpen
                    ? 'selected bg-f2f9fc'
                    : ''
                }`}
                key={`${id}-${index}`}
              >
                <div className="flex flex-auto items-center space-x-2">
                  <div className={'block truncate text-sm'}>{option.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterDropdown;
