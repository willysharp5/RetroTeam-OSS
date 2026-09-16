import { useState } from 'react';

import Image from 'next/image';

import caretLeft from 'public/assets/svg/caret-left.svg';
import caretRight from 'public/assets/svg/caret-right.svg';

interface Props {
  rowsPerPage: number;
  setRowsPerPage: any;
  totalPages: number;
  currentPage: number;
  refetch: Function;
  search: (page: number, text: string) => void;
  text: string;
  sort?: string;
  lastId?: string;
}

const SearchablePaginationController = ({
  rowsPerPage,
  setRowsPerPage,
  totalPages,
  currentPage,
  refetch,
  search,
  sort,
  text,
  lastId,
}: Props) => {
  const [localRowsPage, setLocalRowsPage] = useState(rowsPerPage);

  return (
    <div className="text-sm md:flex justify-end items-center space-y-1 space-x-0 md:space-y-0 md:space-x-8">
      <div className="flex space-x-2">
        <p className="my-auto">Rows per page</p>
        <input
          min={1}
          onChange={(e) => {
            setLocalRowsPage(parseInt(e.target.value));
          }}
          onKeyDown={(e: any) => {
            if (e.key === 'Enter') {
              if (localRowsPage > 0) {
                console.log(e);
                setRowsPerPage(parseInt(e.target.value));
              }
            }
          }}
          onBlur={(e) => {
            if (localRowsPage > 0) {
              setRowsPerPage(parseInt(e.target.value));
            }
          }}
          value={localRowsPage}
          className="border w-[70px] pl-3 h-8 w-8 rounded-md"
          type="number"
        />
      </div>
      <div className="my-auto">
        <p>
          Page {currentPage} of {totalPages}
        </p>
      </div>
      <div className="my-auto flex space-x-2">
        <button
          className="border rounded-md shadow-sm h-8 w-8"
          onClick={() => {
            if (currentPage > 1) {
              if (text !== '') {
                search(currentPage - 1, text);
              } else {
                refetch(currentPage - 1, sort, '');
              }
            }
          }}
        >
          <Image className="m-auto" src={caretLeft} alt="caret left" />
        </button>
        <button
          onClick={() => {
            if (currentPage < totalPages) {
              if (text !== '') {
                search(currentPage + 1, text);
              } else {
                refetch(currentPage + 1, sort, lastId);
              }
            }
          }}
          className="border rounded-md shadow-sm h-8 w-8"
        >
          <Image className="m-auto" src={caretRight} alt="caretRight" />
        </button>
      </div>
    </div>
  );
};

export default SearchablePaginationController;
