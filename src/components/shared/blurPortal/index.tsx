import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface BlurPortalProps {
  children: ReactNode;
}

export default function BlurPortal({ children }: BlurPortalProps) {
  const portalRoot =
    document.querySelector('body') || document.createElement('div');
  const portal = useRef(document.createElement('div'));
  portal.current.classList.add(
    'absolute',
    'flex',
    'justify-center',
    'items-center',
    'z-50',
    'w-screen',
    'h-screen',
    'backdrop-blur-sm',
    'bg-gray-950',
    'bg-opacity-10',
    'top-0',
    'left-0',
  );

  useEffect(() => {
    const portalElement = portal.current;
    portalRoot?.appendChild(portalElement);

    return () => {
      portalRoot?.removeChild(portalElement);
    };
  }, [portalRoot]);

  return createPortal(children, portal.current);
}
