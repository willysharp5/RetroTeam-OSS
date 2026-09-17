import Link from 'next/link';
import BlurPortal from '../blurPortal';
import Image from 'next/image';
import x from 'public/assets/svg/x.svg';
interface AnonymousModalProps {
  description: string;
  closeModalHandler?: () => void;
}

export function AnonymousModal({
  description,
  closeModalHandler,
}: AnonymousModalProps) {
  return (
    <BlurPortal>
      <div className="absolute">
        <div className="min-h-screen flex items-center justify-center">
          <div className="fixed inset-0"></div>

          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg md:w-2/6 mx-6 md:mx-0">
              <div className="flex justify-between items-center mb-1.5">
                <h2 className="text-lg font-semibold"></h2>
                {closeModalHandler && (
                  <button onClick={(e) => closeModalHandler()}>
                    <Image src={x} alt="x" />
                  </button>
                )}
              </div>

              <p className="text-[#71717A]">{description}</p>

              <div className="mt-4 flex space-x-4 justify-end">
                {closeModalHandler && (
                  <button
                    onClick={() => closeModalHandler()}
                    className="px-4 py-2 bg-white border text-black rounded hover:bg-zinc-100 focus:outline-none"
                  >
                    Cancel
                  </button>
                )}
                <Link
                  href={'/auth/sign-in'}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-zinc-600 focus:outline-none"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BlurPortal>
  );
}
