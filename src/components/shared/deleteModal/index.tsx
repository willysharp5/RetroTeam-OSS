import { Dispatch, SetStateAction, MouseEvent } from 'react';
import Image from 'next/image';

import BlurPortal from '../blurPortal';

import { Toaster } from 'react-hot-toast';
import x from 'public/assets/svg/x.svg';

interface DeleteModalProps {
  title?: string;
  message?: string;
  confirmMessage?: string;
  cancelMessage?: string;
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  confirmAction: (event: MouseEvent<HTMLButtonElement>) => void;
  cancelAction?: (event: MouseEvent<HTMLButtonElement>) => void;
  typeMessage?: string;
}

export default function DeleteModal({
  title,
  message,
  confirmMessage,
  cancelMessage,
  showModal,
  setShowModal,
  confirmAction,
  cancelAction,
  typeMessage = 'string',
}: DeleteModalProps) {
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
              <div className="bg-white p-6 rounded-lg shadow-lg w-full md:w-2/6 mx-6 md:mx-0">
                <div className="flex justify-between items-center mb-1.5">
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <button
                    onClick={cancelAction ? cancelAction : defaultCloseModal}
                  >
                    <Image src={x} alt="x" />
                  </button>
                </div>
                {typeMessage === 'html' && message ? (
                  <div dangerouslySetInnerHTML={{ __html: message }} />
                ) : (
                  <p className="text-[#71717A]">{message || ''}</p>
                )}

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={cancelAction ? cancelAction : defaultCloseModal}
                    className="px-4 py-2 bg-white border text-black rounded hover:bg-zinc-100 focus:outline-none"
                  >
                    {cancelMessage ? cancelMessage : 'No'}
                  </button>
                  <button
                    onClick={confirmAction}
                    type="submit"
                    className="px-4 py-2 bg-[#EF4444] text-white rounded hover:bg-red-600 focus:outline-none"
                  >
                    {confirmMessage ? confirmMessage : 'Yes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BlurPortal>
    );
}
