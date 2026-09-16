interface SectionTitleBarProps {
  title: string;
  children?: React.ReactNode;
  color?: string;
}

export const SectionTitleBar = ({
  title,
  children,
  color = 'zinc-100',
}: SectionTitleBarProps) => {
  return (
    <div
      className={`flex justify-between items-center w-full bg-${color} h-20 p-2.5`}
    >
      <h2 className="text-2xl font-extrabold">{title}</h2>
      {children && <div className="flex space-x-2">{children}</div>}
    </div>
  );
};
