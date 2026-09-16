interface BadgeProps {
  open?: boolean;
  isCompleted?: boolean;
}

export default function Badge({
  open = false,
  isCompleted = false,
}: BadgeProps) {
  const sharedClasses = 'px-2 font-semibold rounded-full';
  const className = open
    ? `${sharedClasses} text-gray-50 bg-green-500`
    : `${sharedClasses} text-white bg-[#EF4444]`;
  return <div className={className}>{open ? 'Open' : 'Closed'}</div>;
}
