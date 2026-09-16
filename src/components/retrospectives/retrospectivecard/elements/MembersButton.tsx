import Image from 'next/image';

import users from '/public/assets/svg/users.svg';

interface MembersButtonProps {
  members?: number;
  onClick: () => void;
}

export default function MembersButton({
  members = 0,
  onClick,
}: MembersButtonProps) {
  return (
    <div
      className="flex border border-solid h-fit border-zinc-200 rounded-md py-2 px-4 text-sm bg-white cursor-pointer"
      onClick={onClick}
    >
      <Image className="w-4 mr-2" src={users} alt="users" /> {members} Members
    </div>
  );
}
