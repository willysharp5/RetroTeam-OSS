import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import x from 'public/assets/svg/x.svg';

import Sidebar from '~/core/ui/SideBarComponent';
import PaginationController from '../shared/paginationController';

export default function RetrospectivesSidebar({
  setShowSidebar,
  analyzedRetrospectives,
}: any) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const totalPages = Math.ceil(analyzedRetrospectives.length / rowsPerPage);

  const refetch = (page: number) => {
    setCurrentPage(page);
  };

  const currentData = analyzedRetrospectives.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  return (
    <Sidebar>
      <div
        className={`md:w-[450px] w-full z-50 shadow-lg bg-white h-full fixed top-0 right-0 overflow-y-auto flex flex-col`}
      >
        <div className="flex justify-between p-6">
          <p className="text-sm font-black">Analyzed Retrospectives</p>
          <Image
            className="h-6 w-6 cursor-pointer"
            src={x}
            alt="x"
            onClick={() => setShowSidebar(false)}
          />
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          {currentData && currentData.length > 0 ? (
            <ul>
              {currentData.map((retrospective: any, index: number) => (
                <li key={index} className="mb-4 flex items-center">
                  <span className="mr-2">•</span>
                  <Link href={`/board/${retrospective.id}`} className="">
                    <h3 className="text-blue-500 underline text-sm font-semibold">
                      {retrospective.name}
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              No retrospectives available.
            </p>
          )}
        </div>
        <div className="p-6">
          <PaginationController
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            totalPages={totalPages}
            currentPage={currentPage}
            refetch={refetch}
          />
        </div>
      </div>
    </Sidebar>
  );
}
