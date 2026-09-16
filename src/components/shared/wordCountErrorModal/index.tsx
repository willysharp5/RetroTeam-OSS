import { Dispatch, SetStateAction, MouseEvent } from 'react';

import BlurPortal from '../blurPortal';

import { Toaster } from 'react-hot-toast';
import x from 'public/assets/svg/x.svg';

interface WordCounterErrorModalProps {
  showModal: boolean;
  message: string;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  cancelAction?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export default function WordCounterErrorModal({
  showModal,
  message,
  setShowModal,
  cancelAction,
}: WordCounterErrorModalProps) {
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
                    {message}
                  </h2>
                </div>
                <button
                  className="px-4 py-2 mt-4 bg-gray-900 text-white rounded hover:bg-gray-600 focus:outline-none"
                  onClick={cancelAction ? cancelAction : defaultCloseModal}
                >
                  Ok
                </button>
              </div>
            </div>
          </div>
        </div>
      </BlurPortal>
    );
}
