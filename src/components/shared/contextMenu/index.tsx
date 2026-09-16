import { useState, useEffect, MouseEvent, useRef } from 'react';
import Image from 'next/image';

import contextIcon from 'public/assets/svg/3-dots.svg';

interface Option {
  name: string;
  action: any;
  icon?: string;
}
interface ContextMenuProps {
  options: Option[];
  className?: any;
  mainClassName?: any;
}

export default function ContextMenu({
  options,
  className,
  mainClassName,
}: ContextMenuProps) {
  const [showMenu, setShowMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const onClickContext = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleClickOutside = (event: any) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      className={
        mainClassName
          ? mainClassName
          : 'top-4 right-4 px-3 py-1 flex justify-center z-0'
      }
      onClick={onClickContext}
    >
      <Image
        className="group-hover:brightness-[5]"
        src={contextIcon}
        alt="Context Menu"
      />
      {showMenu && (
        <div
          ref={menuRef}
          className={
            className
              ? className
              : 'absolute w-max space-y-2 rounded-md py-1.5 px-2 top-6 right-5 z-50 bg-white border shadow-md text-black'
          }
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((option: Option, index: number) => {
            return (
              <button
                key={`menu option ${index}`}
                className="flex space-x-2"
                onClick={(e) => {
                  option.action(e);
                  setShowMenu(false);
                }}
              >
                {option.icon && (
                  <Image
                    width={16}
                    height={16}
                    src={option.icon}
                    alt={option.name.toLowerCase()}
                  />
                )}
                <p className="text-sm font-normal">{option.name}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
