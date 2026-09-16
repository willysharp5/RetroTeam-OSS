import { ReactNode } from 'react';
import Link from 'next/link';

interface SectionHeaderProps {
  description?: string;
  redirectTo?: string;
  children: ReactNode;
}

export default function SectionHeader({
  description,
  redirectTo,
  children,
}: SectionHeaderProps) {
  return (
    <div className="md:flex justify-between">
      <div>
        <h1 className="text-pink-600 text-lg">{children}</h1>
        <p className="text-sm text-zinc-600">{description}</p>
      </div>
      <div className="">
        {redirectTo && redirectTo !== '/actions' && (
          <Link href={redirectTo}>
            <p className="text-orange-600 underline text-[15px]">See all</p>
          </Link>
        )}
      </div>
    </div>
  );
}
