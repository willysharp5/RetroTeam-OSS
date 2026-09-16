import { Fragment, useState, useEffect, ReactNode } from 'react';
import * as ReactDOM from 'react-dom';

interface ModalOverlayProps {
  children: ReactNode;
  onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = (props) => {
  return <Fragment>{props.children}</Fragment>;
};

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = (props) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const element = document.getElementById('overlay');
      setPortalElement(element);
    }
  }, []);

  return (
    <Fragment>
      {portalElement &&
        ReactDOM.createPortal(
          <ModalOverlay onClose={props.onClose}>{props.children}</ModalOverlay>,
          portalElement,
        )}
    </Fragment>
  );
};

export default Modal;
