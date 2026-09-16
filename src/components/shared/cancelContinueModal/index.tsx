import { Dispatch, SetStateAction, MouseEvent } from 'react';

import BlurPortal from '../blurPortal';

import { Toaster } from 'react-hot-toast';

interface CancelContinueModalProps {
  title?: string;
  message?: string;
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  confirmAction: (event: MouseEvent<HTMLButtonElement>) => void;
  cancelAction?: (event: MouseEvent<HTMLButtonElement>) => void;
  typeMessage?: string;
  confirmMessage?: string;
}

export default function CancelContinueModal({
  title,
  message,
  showModal,
  setShowModal,
  confirmAction,
  cancelAction,
  typeMessage = 'string',
  confirmMessage = 'Continue',
}: CancelContinueModalProps) {
  const defaultCloseModal = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setShowModal(false);
  };
  if (showModal)
    return (
      <BlurPortal>
        <Toaster />
        <div className="relative bg-white p-6 rounded-lg shadow-xl h-auto w-full md:w-[512px] overflow-y-auto">
          <div className="text-lg font-semibold justify-center items-center space-y-2">
            <h1>{title ? title : ''}</h1>
            {typeMessage === 'html' && message ? (
              <div
                className="text-sm text-[#71717A] font-normal text-left"
                dangerouslySetInnerHTML={{ __html: message }}
              />
            ) : (
              <h2 className="text-sm text-[#71717A] font-normal text-left">
                {message ? message : 'Are you sure you want to delete this?'}
              </h2>
            )}
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={cancelAction ? cancelAction : defaultCloseModal}
              className="px-8 py-2 border text-black rounded hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={confirmAction}
              className="px-8 py-2 bg-black text-white rounded hover:bg-zinc-600 focus:outline-none"
            >
              {confirmMessage}
            </button>
          </div>
        </div>
      </BlurPortal>
    );
}
