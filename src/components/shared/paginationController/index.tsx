import { useState } from 'react';

import Image from 'next/image';

import caretLeft from 'public/assets/svg/caret-left.svg';
import caretRight from 'public/assets/svg/caret-right.svg';
import { toast } from 'react-hot-toast';

interface Props {
  rowsPerPage: number;
  setRowsPerPage: any;
  totalPages: number;
  currentPage: number;
  refetch: any;
  hasLimit?: any;
}

const PaginationController = ({
  rowsPerPage,
  setRowsPerPage,
  totalPages,
  currentPage,
  refetch,
  hasLimit = undefined,
}: Props) => {
  const [localRowsPage, setLocalRowsPage] = useState(rowsPerPage);

  return (
    <div className="text-sm md:flex justify-end items-center space-y-1 space-x-0 md:space-y-0 md:space-x-8">
      <div className="flex space-x-2">
        <p className="my-auto">Rows per page</p>
        <input
          max={hasLimit}
          min={1}
          onChange={(e) => {
            setLocalRowsPage(parseInt(e.target.value));
          }}
          onKeyDown={(e: any) => {
            if (e.key !== 'Enter') return;
          
            const value = parseInt(e.target.value);
          
            if (localRowsPage <= 0) return;
          
            if (typeof hasLimit === 'number' && value > hasLimit) {
              toast.error(`Only up to ${hasLimit} hits can be fetched per page.`);
              return;
            }
          
            setRowsPerPage(value);
          }}
          
          onBlur={(e) => {
            const value = parseInt(e.target.value);
          
            if (localRowsPage <= 0) return;
          
            if (typeof hasLimit === 'number' && value > hasLimit) {
              toast.error(`Only up to ${hasLimit} hits can be fetched per page.`);
              return;
            }
          
            setRowsPerPage(value);
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
          className="border rounded-md shadow-sm h-8 w-8 bg-white"
          onClick={() => {
            if (currentPage > 1) {
              refetch(currentPage - 1);
            }
          }}
        >
          <Image className="m-auto" src={caretLeft} alt="caret left" />
        </button>
        <button
          onClick={() => {
            if (currentPage < totalPages) {
              refetch(currentPage + 1);
            }
          }}
          className="border rounded-md shadow-sm h-8 w-8 bg-white"
        >
          <Image className="m-auto" src={caretRight} alt="caretRight" />
        </button>
      </div>
    </div>
  );
};

export default PaginationController;
