import Image from 'next/image';

import { useCallback, useEffect, useRef, useState } from 'react';
import toaster from 'react-hot-toast';

import { BoardColumn } from '~/lib/board/types/types';

import BoardAsigneeSelector from './BoardAssigneeSelector';

import close from 'public/assets/svg/close.svg';
import plusSquare from 'public/assets/svg/plus-square.svg';
import If from '~/core/ui/If';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import useCreateDemoComments from '~/lib/demo/hooks/use-create-demo-comments';

interface AddCommentCardProps {
  column: BoardColumn;
  textAreaRef: any;
  setShowCard: (show: boolean) => void;
  createTask: (task: any) => void;
  retrospective: Retrospectives;
}

export default function AddCommentCard({
  column,
  textAreaRef,
  setShowCard,
  createTask,
  retrospective,
}: AddCommentCardProps) {

  const { trigger: addCommentsData } = useCreateDemoComments();

  const [selectedMember, setSelectedMember] = useState<any>('user1@retroteam.ai');
  const [description, setDescription] = useState<string>('');
  const [disableInput, setDisableInput] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const teamSelectorRef = useRef(null);

  const onCreateComments = async () => {
    if (description !== '') {
      setDisableInput(true);
      const body = {
        assignee: selectedMember,
        author: 'user1@retroteam.ai',
        description: description,
        group: '',
        order: -1,
        status: column.id,
      };
      const promise = addCommentsData(body)
        .then((res: any) => {
          if (res.success) {
            setDescription('');
            const data = res.data
            data.user = {}
            createTask(res.data)
            setShowCard(false);
          }
          setDisableInput(false);
        })
        .catch((e: any) => {
          console.log('ERROR onCreateComments', e);
          setDisableInput(false);
        });

      await toaster.promise(promise, {
        loading: 'Creating comment',
        success: 'Comment has been created',
        error: 'Error creating comment',
      });
    } else {
      setShowCard(false);
      setDisableInput(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && textAreaRef.current) {
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
  }, [description, selectedMember]);

  const handleChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = evt.target?.value;

    setDescription(val);
  };

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      const targetId = (e.target as HTMLElement)?.id;

      if (targetId === 'board-container') {
        setShowCard(false);
      }
    },
    [setShowCard],
  );

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div ref={containerRef} className="mb-4" id={`new card`}>
      <div className="relative">
        <div className=" bg-white  border rounded-md shadow-sm">
          <div className="w-full flex justify-end">
            <button
              className="h-8 w-8 pr-2 pt-2"
              onClick={(e) => {
                e.stopPropagation();
                setShowCard(false);
              }}
            >
              <Image className="m-auto" src={close} alt="close"></Image>
            </button>
          </div>
          <div className="p-5">
            <div className="flex justify-between mt-2 w-full">
              <div className="relative w-full">
                <textarea
                  className={`${'min-h-[150px]'}  w-full border border-gray-300 py-2 px-3 rounded focus:outline-none text-base`}
                  id="review-text"
                  onChange={handleChange}
                  placeholder={'Enter your action description'}
                  ref={textAreaRef}
                  rows={1}
                  value={description}
                  disabled={disableInput}
                ></textarea>
                <label
                  htmlFor="review-text"
                  className={`text-xs text-center ${
                    disableInput ? 'bg-gray-50' : 'bg-white'
                  } absolute bottom-2 left-0 mr-4 ml-1 right-3 text-red-500 pointer-events-none`}
                  style={{ zIndex: 5 }}
                >
                  <b>Return</b>&nbsp;to enter new line
                </label>
              </div>
            </div>
            <If condition={retrospective.authors}>
              <div className="mt-6 flex w-full justify-between space-x-6">
                <div className="flex w-full">
                  <div
                    id="teamSelectorContainer"
                    style={{ position: 'relative', zIndex: 10 }}
                    ref={teamSelectorRef}
                    className="Z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <BoardAsigneeSelector
                      selectedMember={selectedMember}
                      setSelectedMember={setSelectedMember}
                      className={'max-w-[250px] overflow-hidden text-left'}
                      members={retrospective?.members}
                    />
                  </div>
                </div>
                <If condition={selectedMember !== ''}>
                  <div className="w-full cursor-pointer items-center flex justify-end">
                    <button
                      className="border rounded-md h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMember('');
                      }}
                    >
                      <Image className="m-auto" src={close} alt="close"></Image>
                    </button>
                  </div>
                </If>
              </div>
            </If>

            <button
              onClick={onCreateComments}
              className="flex items-center justify-center space-x-2 mt-5 bg-[#F4F4F5] rounded-md hover:bg-slate-100 px-4 py-2 w-full text-sm font-medium"
            >
              <Image src={plusSquare} alt="plusSquare"></Image>
              <p>Create</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
