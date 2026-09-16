import Image from 'next/image';
import x from '/public/assets/svg/x.svg';
import BlurPortal from '../blurPortal';

export interface ModalProps {
  closeModalHandler?: () => void;
  title: string;
  description: string;
}

export function InformationModal({
  closeModalHandler,
  title,
  description,
}: ModalProps) {
  return (
    <BlurPortal>
      <div className="absolute">
        <div className="min-h-screen flex items-center justify-center">
          <div className="fixed inset-0"></div>

          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg md:w-2/6 mx-6 md:mx-0">
              <div className="flex justify-between items-center mb-1.5">
                <h2 className="text-lg font-semibold">{title}</h2>
                {closeModalHandler && (
                  <button onClick={(e) => closeModalHandler()}>
                    <Image src={x} alt="x" />
                  </button>
                )}
              </div>

              <p className="text-[#71717A]">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </BlurPortal>
  );
}
