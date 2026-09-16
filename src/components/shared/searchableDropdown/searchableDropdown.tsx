import { ChevronUpDownIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';

const SearchableDropdown = ({
  options,
  label,
  id,
  selectedVal,
  handleChange,
  refetch,
  type,
  placeholder,
  loading,
}: any) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    document.addEventListener('click', toggle);
    return () => document.removeEventListener('click', toggle);
  }, []);

  const selectOption = (option: any) => {
    setQuery(() => option.name);
    handleChange(option);
    setIsOpen((isOpen) => !isOpen);
  };

  function toggle(e: any) {
    setIsOpen(e && e.target === inputRef.current);
  }

  useEffect(() => {
    if (selectedVal) setQuery(selectedVal.name);
  }, [selectedVal]);
  
  return (
    <div className="relative text-gray-700 cursor-default dropdown">
      <div className="relative">
        <div
          className="flex h-10 w-full items-center justify-between
          rounded-md border border-[#E4E4E7] bg-white py-1.5 px-2.5 md:py-2 md:px-4 ring-offset-1 transition-all
          duration-300 placeholder:text-gray-400
          disabled:cursor-not-allowed
          disabled:opacity-50 selected-value"
        >
          <div className="flex space-x-2 w-full">
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder ? placeholder : 'Select a member name'}
              value={query}
              name="searchTerm"
              onChange={(e) => {
                const text = e.target.value;
                setQuery(text);
                if (text.length >= 3) {
                  refetch(text);
                } else if (text === '') {
                  refetch('');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Evita que el formulario se envíe por defecto
                  refetch(query, type);
                  setIsOpen(true);
                }
              }}
              className="outline-none w-full"
              onClick={toggle}
            />
            {selectedVal && (
              <button
                onClick={() => {
                  selectOption('');
                  refetch('');
                  setQuery('')
                }}
              >
                <XCircleIcon className={'h-4'} />
              </button>
            )}
          </div>

          <ChevronUpDownIcon className={'h-4'} />
        </div>
        <div
          className={`arrow absolute right-10 top-14 w-0 h-0 border-5 border-transparent border-solid border-999 ${
            isOpen
              ? 'border-0  border-5 border-solid border-transparent border-transparent-999'
              : ''
          }`}
        ></div>
      </div>

      <div
        className={`options absolute top-full w-full z-10 bg-white border border-ccc box-shadow-0-1-0-bg-opacity-06 overflow-y-auto max-h-200 ${
          isOpen ? 'block' : 'hidden'
        }`}
      >
        {loading ? (
          <LoadingMembersSpinner />
        ) : (
          <>
            {options.map((option: any, index: number) => (
              <div
                onClick={() => selectOption(option)}
                className={`option py-2 px-2 cursor-pointer ${
                  option[label] === selectedVal || isOpen
                    ? 'selected bg-f2f9fc'
                    : ''
                }`}
                key={`${id}-${index}`}
              >
                {option[label]}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchableDropdown;
