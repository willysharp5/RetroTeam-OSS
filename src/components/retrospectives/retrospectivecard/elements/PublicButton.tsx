import Image from 'next/image';

import eyeOpen from '/public/assets/svg/eye-open.svg';
import eyeClosed from '/public/assets/svg/eye-closed.svg';

interface PublicButtonProps {
  isPublic?: boolean;
  onClick: () => void;
  isFacilitator: boolean;
}

export default function PublicButton({
  isPublic = false,
  onClick,
  isFacilitator,
}: PublicButtonProps) {
  return (
    <button
      disabled={!isFacilitator}
      className="flex rounded-md py-2 px-4 h-fit text-sm bg-zinc-100 cursor-pointer"
      onClick={onClick}
    >
      <Image
        className="w-4 mr-2"
        src={isPublic ? eyeOpen : eyeClosed}
        alt="eye"
      />{' '}
      {isPublic ? 'Public' : 'Private'}
    </button>
  );
}
