import Image from 'next/image';

import x from 'public/assets/svg/x.svg';

import BlurPortal from '../shared/blurPortal';
import InviteMembersForm from './InviteMembersForm';

interface AddAdminsModalProps {
  setShowAdminModal: (show: boolean) => void;
  allowedAdmins: number;
}

export default function AddAdminsModal({
  setShowAdminModal,
  allowedAdmins,
}: AddAdminsModalProps) {
  return (
    <BlurPortal>
      <div className="relative bg-white p-6 rounded-lg shadow-xl h-auto w-full max-h-[462px] overflow-y-auto md:w-[762px] space-y-4 overflow-y-auto">
        <div className="flex justify-between">
          <div>
            <p className="text-lg font-semibold">Add Admins</p>
            <p className="text-sm text-[#71717A] font-normal">
              Promote existing members or send emails to people outside your
              organization. Email invitation expire after 14 days.{' '}
            </p>
          </div>

          <Image
            className="h-6 w-6 cursor-pointer"
            src={x}
            alt="x"
            onClick={() => setShowAdminModal(false)}
          ></Image>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Email</p>
            <p className="text-xs w-full text-red-500 text-end">
              {allowedAdmins} remaining
            </p>
          </div>
          <InviteMembersForm
            setShowAdminModal={setShowAdminModal}
            limit={allowedAdmins}
            onlyAdmins={true}
          />
        </div>
      </div>
    </BlurPortal>
  );
}
