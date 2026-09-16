import { Dispatch, SetStateAction, MouseEvent } from 'react';

import BlurPortal from '../blurPortal';

import { Toaster } from 'react-hot-toast';

interface ConfirmationModalProps {
  showModal: boolean;
  message: string;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  cancelAction?: (event: MouseEvent<HTMLButtonElement>) => void;
  confirmAction: (event: MouseEvent<HTMLButtonElement>) => void;
  confirmMessage?: string;
  cancelMessage?: string;
}

export default function ConfirmationModal({
  showModal,
  message,
  setShowModal,
  cancelAction,
  confirmAction,
  confirmMessage,
  cancelMessage,
}: ConfirmationModalProps) {
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
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={cancelAction ? cancelAction : defaultCloseModal}
                    className="px-8 py-2 border text-black rounded hover:bg-gray-50 focus:outline-none"
                  >
                    {cancelMessage ? cancelMessage : 'Cancel'}
                  </button>
                  <button
                    onClick={confirmAction}
                    className="px-8 py-2 bg-black text-white rounded hover:bg-zinc-600 focus:outline-none"
                  >
                    {confirmMessage ? confirmMessage : 'Continue'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BlurPortal>
    );
}
