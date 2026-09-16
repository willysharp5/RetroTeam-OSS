import { Dispatch, SetStateAction, MouseEvent } from 'react';
import Image from 'next/image';

import BlurPortal from '../blurPortal';
import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';

import { Toaster } from 'react-hot-toast';
import x from 'public/assets/svg/x.svg';
import If from '~/core/ui/If';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

interface AiLoaderProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  cancelAction?: (event: MouseEvent<HTMLButtonElement>) => void;
  role: number;
}

export default function AiLoader({
  showModal,
  setShowModal,
  cancelAction,
  role
}: AiLoaderProps) {
  const defaultCloseModal = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setShowModal(false);
  };
  if (showModal)
    return (
      <BlurPortal>
        <div className="absolute">
          <div className="min-h-screen flex items-center justify-center">
            <div className="fixed inset-0"></div>
            <Toaster position="top-center" reverseOrder={false} />
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="relative flex flex-col items-center bg-white p-6 rounded-lg shadow-lg md:w-2/6 mx-6 md:mx-0">
                <div className="flex w-100 justify-between items-center mb-1.5">
                  <h2 className="text-lg text-center font-semibold">
                    RetroTeam Ai is Grouping and Tagging your Comments...
                  </h2>
                </div>
                <LoadingMembersSpinner />
                <If condition={role === MembershipRole.Facilitator}>
                <button
                  className="px-4 py-2 mt-4 bg-[#EF4444] text-white rounded hover:bg-red-600 focus:outline-none"
                  onClick={cancelAction ? cancelAction : defaultCloseModal}
                >
                  Cancel
                </button>
                </If>
               
              </div>
            </div>
          </div>
        </div>
      </BlurPortal>
    );
}
