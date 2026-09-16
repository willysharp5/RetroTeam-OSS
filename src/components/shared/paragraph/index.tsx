import { Fragment, useEffect, useRef, useState } from 'react';

import { TooltipContent, Tooltip, TooltipTrigger } from '~/core/ui/Tooltip';

interface ParagraphProps {
  description: string;
  onDoubleClickEvent: () => void;
}

export default function Paragraph({
  description,
  onDoubleClickEvent,
}: ParagraphProps) {
  const contentRef = useRef(null);

  const [hasOverflow, setHasOverflow] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  const handleClick = () => {
    setShowFullText(!showFullText);
  };

  useEffect(() => {
    if (contentRef.current) {
      const { clientHeight, scrollHeight } = contentRef.current;
      if (scrollHeight > clientHeight) {
        setHasOverflow(true);
      }
    }
  });

  return (
    <Tooltip>
      <TooltipTrigger className="w-full relative">
        <div className="text-left">
          <p
            ref={contentRef}
            onDoubleClick={onDoubleClickEvent}
            className="overflow-hidden flex-grow flex-shrink min-w-0 my-auto cursor-pointer overflow-hidden"
            style={
              showFullText
                ? {
                    display: '-webkit-box',
                    WebkitLineClamp: 'unset',
                    WebkitBoxOrient: 'vertical',
                    overflowWrap: 'anywhere',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }
                : {
                    textOverflow: 'ellipsis',
                    WebkitLineClamp: 2,
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    overflowWrap: 'anywhere',
                    whiteSpace: 'pre-wrap',
                  }
            }
            onClick={handleClick}
          >
            {description.split('\n').map((line: string, index: number) => (
              <Fragment key={index}>
                {line}
                <br />
              </Fragment>
            ))}
          </p>{' '}
        </div>
      </TooltipTrigger>
      {!showFullText && hasOverflow && (
        <TooltipContent side="top">Click to expand text</TooltipContent>
      )}
    </Tooltip>
  );
}
