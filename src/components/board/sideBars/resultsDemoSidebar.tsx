import Image from 'next/image';

import Sidebar from '~/core/ui/SideBarComponent';
import download from 'public/assets/svg/download.svg';
import x from 'public/assets/svg/x.svg';
import fullScreen from 'public/assets/svg/enter-full-screen.svg';

import { showFullDate } from '~/components/utils/dateformatter';

import ReactToPrint from 'react-to-print';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/router';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import ResultsDemo from '~/components/demo-board/ResultsPage';

 interface ResultsSidebarProps {
  setShowResultsBar: (show: boolean) => void;
  retrospective: Retrospectives;
}

export default function ResultsDemoSidebar({
  setShowResultsBar,
  retrospective,
}: ResultsSidebarProps) {
  const printRef = useRef(null);

  const reactToPrintContent = useCallback(() => {
    return printRef.current;
  }, []);

  const reactToPrintTrigger: any = useCallback(() => {
    return (
      <button
        className={`flex justify-center items-center bg-orange-500 hover:bg-orange-400 text-white py-2 px-4 rounded-md print:hidden`}
      >
        <Image className="mr-2" src={download} alt="" />
        <span> Export to PDF</span>
      </button>
    );
  }, []);

  const router = useRouter();

  const onRedirectToResultsPage = useCallback(async () => {
    try {
      router.push("/demo/results")
    } catch (e) {
      console.error(e);
    }
  }, [router]);
  

  const [showAuthors, setShowAuthors] = useState(true);

  useEffect(() => {
    if (retrospective) {
      setShowAuthors(retrospective.authors as boolean);
    }
  }, [retrospective]);

  return (
    <Sidebar>
      <div className="w-full md:w-[700px] print:w-full z-50 bg-white h-full shadow-md border-l fixed top-0 right-0 print:overflow-hidden overflow-y-auto">
        <div className="sticky bg-white top-0 z-20 p-6">
          <div className="bg-white print:hidden flex justify-end">
            <Image
              className="h-6 w-6 cursor-pointer"
              src={x}
              alt="x"
              onClick={() => setShowResultsBar(false)}
            ></Image>
          </div>
          <div
            className={`flex flex-col justify-center space-y-2 ${'text-left sticky bg-white top-0 z-20'}`}
          >
            <h1 className="text-2xl font-black">{retrospective.name}</h1>
            <span className="text-sm text-zinc-500">
              {retrospective?.title} -{' '}
              {retrospective?.date
                ? showFullDate(retrospective.date.toDate())
                : '...'}
            </span>
            <div className="md:flex space-y-2 md:space-y-0 md:space-x-2">
              <ReactToPrint
                content={reactToPrintContent}
                documentTitle={retrospective?.title}
                trigger={reactToPrintTrigger}
              />
              <button
                onClick={onRedirectToResultsPage}
                className={`flex justify-center items-center bg-white hover:bg-gray-100 border  text-black py-2 px-4 rounded-md print:hidden`}
              >
                <Image className="mr-2" src={fullScreen} alt="" />
                <span> View in full Page </span>
              </button>
              <div className="flex items-center space-x-1 text-sm">
                  <p className='w-max'>Show author of comments</p>
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          setShowAuthors(!showAuthors);
                        }}
                        checked={showAuthors}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>
            </div>
          </div>
        </div>
        <div className="pt-0 p-6">
          <ResultsDemo hasHeader={false} printRef={printRef} showAuthorsProps={showAuthors} />
        </div>
      </div>
    </Sidebar>
  );
}
