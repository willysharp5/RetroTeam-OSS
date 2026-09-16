import search from 'public/assets/svg/magnifying-glass.svg';
import Image from 'next/image';
import React, { Fragment } from 'react';
import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';
import If from '~/core/ui/If';

import { useState } from 'react';

import caretLeft from 'public/assets/svg/caret-left.svg';
import caretRight from 'public/assets/svg/caret-right.svg';
import { toast } from 'react-hot-toast';

interface FilterBoxProps {
  name: string;
  setName: (name: string) => void;
  data: any[];
  placeholder: string;
  selectedValues: any;
  setSelectedValues: (values: any) => void;
  nameAccessKey?: string;
  numberAccessKey?: string;
  loading: boolean;
  pagination?: boolean;
  rowsPerPage?: number;
  setRowsPerPage?: any;
  totalPages?: number;
  currentPage?: number;
  refetch?: any;
  hasLimit?:any;
}

function FilterBox({
  name,
  setName,
  data,
  placeholder,
  selectedValues = [],
  setSelectedValues,
  nameAccessKey = 'name',
  numberAccessKey = 'number',
  loading,
  pagination = false,
  rowsPerPage,
  setRowsPerPage,
  totalPages,
  currentPage,
  refetch,
  hasLimit
}: FilterBoxProps) {
  const handleCheckboxChange = (item: any) => {
    if (item.document) {
      setSelectedValues((prev: any) => {
        if (prev.find((i: any) => i.document.id === item.document.id)) {
          return prev.filter((i: any) => i.document.id !== item.document.id);
        } else {
          return [...prev, item];
        }
      });
    } else {
      setSelectedValues((prev: any) => {
        if (prev.find((i: any) => i.id === item.id)) {
          return prev.filter((i: any) => i.id !== item.id);
        } else {
          return [...prev, item];
        }
      });
    }
  };

  const getDynamicValue = (item: any, path: string) => {
    const pathParts = path.split('.');

    const value = pathParts.reduce((acc, part) => acc?.[part], item);
    return value;
  };

  const onClearFilters = () => {
    setSelectedValues([]);
    setName('');
  };

  return (
    <div className="shadow-md w-full border rounded-md bg-white w-auto">
      <div className="flex items-center pl-3 border-b">
        <div className="outline-none flex items-center relative">
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            className="w-full outline-none px-3 py-2 pl-8"
            placeholder={placeholder}
          />
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
      <div className="px-4 my-4 space-y-4">
        {loading ? (
          <div className="flex justify-center">
            <LoadingMembersSpinner />
          </div>
        ) : (
          <Fragment>
            {data.map((item: any) => {
              const nameValue = getDynamicValue(item, nameAccessKey);
              const numberValue = getDynamicValue(item, numberAccessKey);

              return (
                <div
                  key={nameValue + item.id}
                  className="flex items-center space-x-6"
                >
                  <div className="w-max">
                    <input
                      type="checkbox"
                      className="peer bg-white border border-black rounded-sm relative h-4 w-4 cursor-pointer appearance-none transition-all before:absolute before:top-1/2 before:left-1/2 before:-translate-y-1/2 before:-translate-x-1/2 before:content-['✓'] before:text-white before:text-xs before:opacity-0 checked:bg-black checked:before:opacity-100"
                      checked={selectedValues.some((selected: any) => {
                        if (selected.document) {
                          return selected.document.id === item.document.id;
                        } else {
                          return selected.id === item.id;
                        }
                      })}
                      onChange={() => handleCheckboxChange(item)}
                    />
                  </div>

                  <p className="">{nameValue}</p>
                  <p className="text-sm">
                    {numberValue !== undefined && numberValue !== null
                      ? numberValue
                      : ''}
                  </p>
                </div>
              );
            })}
          </Fragment>
        )}
      </div>
      <button
        className="border-t py-2 w-full text-center"
        onClick={onClearFilters}
      >
        Clear filters
      </button>
      <If condition={pagination}>
        <div className="border-t p-2 text-center">
          <PaginationController
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            totalPages={totalPages}
            currentPage={currentPage}
            refetch={refetch}
            hasLimit={hasLimit}
          />
        </div>
      </If>
    </div>
  );
}

interface Props {
  rowsPerPage?: number;
  setRowsPerPage?: any;
  totalPages?: number;
  currentPage?: number;
  refetch?: any;
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
    <div className="text-sm justify-end items-center space-y-3">
      <div className="flex space-x-2">
        <p className="my-auto">Rows per page</p>
        <input
          min={1}
          max={hasLimit}
          onChange={(e) => {
            setLocalRowsPage(parseInt(e.target.value));
          }}
          onKeyDown={(e: any) => {
            if (e.key !== 'Enter') return;

            const value = parseInt(e.target.value);

            if (localRowsPage) if (localRowsPage <= 0) return;

            if (typeof hasLimit === 'number' && value > hasLimit) {
              toast.error(
                `Only up to ${hasLimit} hits can be fetched per page.`,
              );
              return;
            }

            setRowsPerPage(value);
          }}
          onBlur={(e) => {
            const value = parseInt(e.target.value);

            if (localRowsPage) if (localRowsPage <= 0) return;

            if (typeof hasLimit === 'number' && value > hasLimit) {
              toast.error(
                `Only up to ${hasLimit} hits can be fetched per page.`,
              );
              return;
            }

            setRowsPerPage(value);
          }}
          value={localRowsPage}
          className="border w-[70px] pl-3 h-8 w-8 rounded-md"
          type="number"
        />
      </div>
      <div className="flex justify-between">
        <p>
          Page {currentPage} of {totalPages}
        </p>
        <div className="my-auto flex space-x-2">
          <button
            className="border rounded-md shadow-sm h-8 w-8 bg-white"
            onClick={() => {
              if (currentPage && currentPage > 1) {
                refetch(currentPage - 1);
              }
            }}
          >
            <Image className="m-auto" src={caretLeft} alt="caret left" />
          </button>
          <button
            onClick={() => {
              if (currentPage && totalPages && currentPage < totalPages) {
                refetch(currentPage + 1);
              }
            }}
            className="border rounded-md shadow-sm h-8 w-8 bg-white"
          >
            <Image className="m-auto" src={caretRight} alt="caretRight" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBox;
