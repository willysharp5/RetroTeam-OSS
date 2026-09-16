import { ReactNode, useRef } from 'react';
import BlurPortal from '../blurPortal';

import Image from 'next/image';

import x from 'public/assets/svg/x.svg';

interface RightPanelProps {
  setShowPanel: React.Dispatch<React.SetStateAction<boolean>>;
  panelTitle?: string;
  children: ReactNode;
}

export default function RightPanel({
  setShowPanel,
  panelTitle,
  children,
}: RightPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Function to close the panel when you click out of the target
  // function closePanel(event: any) {
  //   if (panelRef.current && !panelRef.current.contains(event.target as Node))
  //     setShowPanel(false);
  // }

  return (
    <BlurPortal>
      <div
        ref={panelRef}
        className={`shadow-lg border-l bg-white h-full md:w-[430px] absolute top-0 right-0 overflow-y-auto px-6 pb-6 opacity-100`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-5/6 md:w-[366px] justify-between fixed py-6 pb-6 bg-white">
          {panelTitle && (
            <h4 className="font-black truncate">{`${panelTitle}`}</h4>
          )}
          <Image
            className="h-6 w-6 top-4 right-4 cursor-pointer"
            src={x}
            alt="x"
            onClick={(e) => {
              setShowPanel(false);
            }}
          />
        </div>
        <div className="h-6"></div>
        {children}
      </div>
    </BlurPortal>
  );
}
