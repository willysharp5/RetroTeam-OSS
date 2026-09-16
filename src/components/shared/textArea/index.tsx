import { useRef, useEffect, useState } from 'react';

interface TextAreaProps {
  description: string;
  setDescription: (description: string) => void;
  enter: () => void;
  placeholder: string;
  className?: string;
  clickableEvent?: boolean;
}

const CustomTextArea = ({
  description,
  setDescription,
  enter,
  placeholder,
  className,
  clickableEvent = false,
}: TextAreaProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const useAutosizeTextArea = (
    textAreaRef: HTMLTextAreaElement | null,
    value: string,
  ) => {
    useEffect(() => {
      if (textAreaRef && !clickableEvent) {
        textAreaRef.style.height = '0px';
        const scrollHeight = textAreaRef.scrollHeight;

        textAreaRef.style.height = scrollHeight + 'px';
      }
    }, [textAreaRef, value]);
  };

  useAutosizeTextArea(textAreaRef.current, description);

  const [showMessage, setShowMessage] = useState(!clickableEvent);
  const [hasClicked, setHasClicked] = useState(false);

  const handleChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = evt.target?.value;

    setDescription(val);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'Enter' && textAreaRef.current) {
        e.preventDefault();
        const textarea = textAreaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        if (start !== null && end !== null) {
          const prevDescription = textarea.value;
          const newDescription =
            prevDescription.substring(0, start) +
            '\n' +
            prevDescription.substring(end);
          setDescription(newDescription);
          textarea.value = newDescription;
        }
      } else if (e.key === 'Enter') {
        enter();
      }
    };

    if (textAreaRef.current) {
      textAreaRef.current.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (textAreaRef.current) {
        textAreaRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [description]);

  const toggleMessage = () => {
    if (clickableEvent && !hasClicked) {
      setHasClicked(true);
      setShowMessage(true);
      if (textAreaRef.current) {
        textAreaRef.current.style.height = '80px';
      }
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        className={`${
          className ? className : 'min-h-[150px]'
        }  w-full border border-gray-300 py-2 px-3 pb-5 rounded focus:outline-none text-base`}
        id="review-text"
        onChange={handleChange}
        placeholder={placeholder}
        ref={textAreaRef}
        rows={1}
        value={description}
        onBlur={() => {
          if (!clickableEvent) enter();
        }}
        onClick={toggleMessage}
      ></textarea>
      {showMessage && (
        <label
          htmlFor="review-text"
          className="text-xs text-center bg-white absolute bottom-2 left-0 mr-4 ml-1 right-3 text-red-500 pointer-events-none"
          style={{ zIndex: 5 }}
        >
          <b>Return</b>&nbsp;to enter new line
        </label>
      )}
    </div>
  );
};

export default CustomTextArea;
