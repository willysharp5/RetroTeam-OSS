import { useAuth } from 'reactfire';
import BlurPortal from '../blurPortal';
import Modal from '../modal';

const DisabledUserModal = ({ fullName }: any) => {
  const auth = useAuth();

  return (
    <Modal onClose={() => {}}>
      <BlurPortal>
        <div className="absolute">
          <div className="min-h-screen flex items-center justify-center">
            <div className="fixed inset-0"></div>

            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full md:w-2/6 mx-6 md:mx-0">
                <div className="flex justify-between items-center mb-1.5"></div>

                <p className="text-[#71717A]">
                  Hello <b>{fullName}</b> your account has been disabled.{' '}
                  <br></br>
                  If this is in error, please contact{' '}
                  <a href="mailto:hello@retroteam.com" className="underline">
                    hello@retroteam.com
                  </a>
                </p>

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      auth.signOut();
                    }}
                    type="button"
                    className="px-4 py-2 bg-white border text-black rounded hover:bg-zinc-100 focus:outline-none"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BlurPortal>
    </Modal>
  );
};
export default DisabledUserModal;
