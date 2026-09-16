import Image from 'next/image';

import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  Fragment,
} from 'react';

import toaster from 'react-hot-toast';

import { Column, Id, Task } from '~/lib/actions/types/actions';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import Modal from '~/components/shared/modal';
import CustomDatePicker from '~/components/shared/datepicker';

import { XCircleIcon } from '@heroicons/react/24/outline';

import add from 'public/assets/svg/plus.svg';
import x from 'public/assets/svg/x.svg';
import brain from 'public/assets/svg/brain-circuit.svg';
import expand from 'public/assets/svg/expand.svg';
import plusSquare from 'public/assets/svg/plus-square.svg';
import collaps from 'public/assets/svg/collaps.svg';
import uncollaps from 'public/assets/svg/double-arrow-up.svg';

import ActionCard from './ActionCard';

import If from '~/core/ui/If';
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/Select';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@radix-ui/react-collapsible';

import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import useAddDemoActions from '~/lib/demo/hooks/use-add-demo-actions';
import BoardAsigneeSelector from '../../BoardAssigneeSelector';

interface ActionContainerProps {
  column: Column;
  createAction: (task: Task) => void;
  updateAction: (id: string, task: Task) => void;
  deleteAction: (id: Id) => void;
  refetch: () => void;
  archiveAction: (id: string, archive: boolean) => void;
  retrospective: Retrospectives;
  actions: Task[];
  showCard: any;
  setEditCard: (card: any) => void;
  editCard: any;
  refetchTeamMembers: (search: string) => void;
  loadingMembers: boolean;
  isBoard?: boolean;
  isSuperAdmin: boolean;
  aiData: any;
}

function ActionContainer({
  column,
  createAction,
  deleteAction,
  updateAction,
  archiveAction,
  aiData,
  retrospective,
  actions,
  showCard,
  setEditCard,
  editCard,
  refetchTeamMembers,
  loadingMembers,
  isBoard = true,
  isSuperAdmin,
}: ActionContainerProps) {
  const [showPopOver, setShowPopOver] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const [displayAIPopover, setDisplayAIPopover] = useState(true);

  const tasksIds = useMemo(() => {
    return actions && actions.map((task) => task.id);
  }, [actions]);

  const closeModalHandler = () => {
    setShowPopOver(false);
  };

  const showPopOverHandler = (column: any) => {
    setShowPopOver(true);
  };

  const { setNodeRef, transform, transition } = useSortable({
    id: column.id,
    data: {
      type: 'ColumnAction',
      column,
    },
    disabled: false,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [showCard]);

  const isAllowedToCreate = isSuperAdmin;

  const createActionHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setEditCard(column.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        isBoard
          ? `min-w-[382px] w-fit rounded-md flex flex-col space-y-2`
          : 'min-w-[382px] min-h-[500px] w-[490px] tv:w-[400px] rounded-md flex flex-col space-y-2'
      }
    >
      <div className={` ${!isAllowedToCreate && 'mb-4'}`}>
        <div className="mx-2 flex bg-orange-500 text-white rounded-[5px] p-2.5 justify-between">
          <div className="my-auto">
            <h6 className="font-bold ">{column.title}</h6>
          </div>
          <div className="flex space-x-2.5">
            <button
              disabled={actions?.length === 0}
              onClick={() => showPopOverHandler(column.id)}
              className="w-9 h-9 rounded-md bg-white"
            >
              <Image src={expand} className="m-auto" alt="expand" />
            </button>
            <div className="p-4 w-9 h-9 rounded-md bg-[#F4F4F5] flex justify-center items-center">
              <p className="text-sm text-black">
                {Array.isArray(actions) ? actions.length : 0}
              </p>
            </div>
          </div>
        </div>
      </div>
      {isAllowedToCreate && (
        <button
          id="board-container"
          onClick={(e) => {
            createActionHandler(e);
          }}
          style={{ width: '-webkit-fill-available' }}
          className="mx-2 border rounded-md bg-black p-2 flex space-x-2 items-center my-4 relative"
        >
          <Image
            src={add}
            alt="add"
            style={{ width: '16px', height: '16px', pointerEvents: 'none' }}
          />
          <p className="text-sm text-white"> Add your action</p>
        </button>
      )}
      {/*AI POPOVER*/}
      <If condition={retrospective?.actionsWithAI && isBoard}>
        <div className="w-[400px] text-[#71717A] text-sm bg-blue-50 p-2.5 rounded-md">
          <div className="space-y-2.5">
            <Collapsible defaultOpen={true}>
              <div className="flex space-x-2 items-center justify-between">
                <div className="flex items-center bg-orange-100 px-4 py-2 rounded-md h-9 w-12">
                  <Image src={brain} alt="brain" />
                </div>

                <CollapsibleTrigger>
                  <div
                    onClick={() => setDisplayAIPopover(!displayAIPopover)}
                    role="button"
                    tabIndex={0}
                  >
                    <Image
                      src={displayAIPopover ? collaps : uncollaps}
                      className="m-auto"
                      alt="collaps"
                    />
                  </div>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="mt-6">
                  <b className="text-black text-md">
                    Ai Suggested Action Items
                  </b>
                  <Fragment>
                    {aiData && aiData.length > 0 ? (
                      <div className="mt-2">
                        {aiData.map((item: any, index: number) => (
                          <Fragment key={'ai-action' + index}>
                            <p>
                              {index + 1}.{' '}
                              {item.item || item.action || item.Actions || item}
                            </p>
                            <br />
                          </Fragment>
                        ))}
                      </div>
                    ) : (
                      <div className="flex w-full justify-center my-6">
                        <p>No comments</p>
                      </div>
                    )}
                  </Fragment>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </If>

      <div
        className={` space-y-4 justify-center pb-6 md:max-h-[1230px] tv:max-h-[1700px] overflow-y-auto overflow-x-hidden `}
      >
        <If condition={editCard === column.id}>
          <div className="mx-2 m-auto">
            <AddActionCard
              setShowCard={setEditCard}
              showCard={showCard}
              textAreaRef={textAreaRef}
              retrospective={retrospective}
              column={column}
              createAction={createAction}
            />
          </div>
        </If>
        {actions && (
          <SortableContext items={tasksIds}>
            {actions.map((task, index) => (
              <div className="mx-2 m-auto" key={index}>
                <ActionCard
                  index={index}
                  action={task}
                  deleteTask={deleteAction}
                  updateTask={updateAction}
                  archiveTask={archiveAction}
                  isSuperAdmin={isSuperAdmin}
                  active={false}
                  retrospective={retrospective}
                  editCard={editCard}
                  setEditCard={setEditCard}
                />
              </div>
            ))}
          </SortableContext>
        )}
      </div>
      {showPopOver && (
        <Modal onClose={closeModalHandler}>
          <div
            style={{ opacity: 0.7 }}
            className="absolute top-0 left-0 w-full h-full bg-black z-50 opactiy-5"
          ></div>
          <ActionsPopover
            tasks={actions}
            updateAction={updateAction}
            deleteAction={deleteAction}
            archiveAction={archiveAction}
            closeModalHandler={closeModalHandler}
            retrospective={retrospective}
            editCard={editCard}
            setEditCard={setEditCard}
            refetchTeamMembers={refetchTeamMembers}
            loadingMembers={loadingMembers}
            isSuperAdmin={isSuperAdmin}
          ></ActionsPopover>
        </Modal>
      )}
    </div>
  );
}

interface ActionsPopoverProps {
  tasks: Task[];
  closeModalHandler: () => void;
  updateAction: (id: string, task: Task) => void;
  archiveAction: (id: string, archive: boolean) => void;
  deleteAction: (id: Id) => void;
  retrospective: Retrospectives;
  setEditCard: (card: any) => void;
  editCard: any;
  refetchTeamMembers: (search: string) => void;
  loadingMembers: boolean;
  isSuperAdmin: boolean;
}

function ActionsPopover({
  tasks,
  closeModalHandler,
  updateAction,
  archiveAction,
  deleteAction,
  retrospective,
  editCard,
  setEditCard,
  refetchTeamMembers,
  loadingMembers,
  isSuperAdmin,
}: ActionsPopoverProps) {
  return (
    <div className="absolute z-100">
      <div className="flex items-center justify-center">
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50">
          <div className="bg-white w-[90%] h-[90%] p-6 rounded-lg shadow-lg overflow-y-auto">
            <div className="flex justify-between">
              <p className="text-xl font-medium">Action Items</p>
              <button onClick={closeModalHandler}>
                <Image className="h-7 w-7" src={x} alt="x"></Image>
              </button>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3  overflow-y-auto md:overflow-x-hidden overflow-x-scroll pb-6 h-[90%] gap-4">
              {tasks.map((task: Task, index: number) => (
                <div className="md:mx-2  md:w-full" key={index}>
                  <ActionCard
                    index={index}
                    action={task}
                    deleteTask={deleteAction}
                    updateTask={updateAction}
                    archiveTask={archiveAction}
                    active={false}
                    retrospective={retrospective}
                    editCard={editCard}
                    setEditCard={setEditCard}
                    isSuperAdmin={isSuperAdmin}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActionContainerCardProps {
  textAreaRef: any;
  showCard: any;
  setShowCard: (show: any) => void;
  column?: any;
  createAction: (content: Task) => void;
  retrospective: Retrospectives
}

function AddActionCard({
  createAction,
  setShowCard,
  textAreaRef,
  retrospective,
  column,
}: ActionContainerCardProps) {
  const { trigger: addActionsData } = useAddDemoActions();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedMember, setSelectedMember] = useState<any>('');
  const [description, setDescription] = useState<string>('');
  const [disabledInput, setDisableInput] = useState(false);
  const [status, setStatus] = useState('To do');

  useEffect(() => {
    if (column.id != 'action') {
      setStatus(column.id);
    }
  }, [column]);

  const onCreateActions = useCallback(async () => {
    if (description !== '') {
      setDisableInput(true);
      const body = {
        description: description,
        assignee: selectedMember,
        date: selectedDate,
        order: -1,
        status: status,
        author: 'user1@retroteam.ai',
      };
      const promise = addActionsData(body)
        .then((res: any) => {
          if (res.success) {
            setDescription('');
            createAction(res.data);
            setShowCard(false);
          }
          setDisableInput(false);
        })
        .catch((e) => {
          console.error('ERROR onCreateActions', e);
          setDisableInput(false);
        });

      await toaster.promise(promise, {
        loading: 'Creating action',
        success: 'Action has been created',
        error: 'Error creating action',
      });
    }
  }, [
    description,
    selectedMember,
    selectedDate,
    addActionsData,
    createAction,
    setShowCard,
    status,
  ]);

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
  }, [description, selectedMember, selectedDate, onCreateActions]);

  const handleChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = evt.target?.value;

    setDescription(val);
  };

  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      const targetId = (e.target as HTMLElement)?.id;

      if (targetId === 'action-container') {
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
    <div
      ref={containerRef}
      className="w-min-[350px] tv:w-min-[400px]  mb-4"
      id={`new card`}
    >
      <div className="relative cursor-grab">
        <div className=" bg-white border rounded-md shadow-sm">
          <div className="p-5">
            <div className="w-full flex justify-between items-center">
              <div className="w-1/2">
                <Select
                  disabled={disabledInput}
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value);
                  }}
                >
                  <SelectTrigger data-cy={'role-selector-trigger'}>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem
                      key={'To Do'}
                      data-cy={'filter-status'}
                      value={'To do'}
                    >
                      <p>To Do</p>
                    </SelectItem>
                    <SelectItem
                      key={'In Progress'}
                      data-cy={'filter-status'}
                      value={'In Progress'}
                    >
                      <p>In Progress</p>
                    </SelectItem>
                    <SelectItem
                      key={'Done'}
                      data-cy={'filter-status'}
                      value={'Done'}
                    >
                      <p>Done</p>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <button
                className="h-8 w-8 "
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCard(false);
                }}
              >
                <Image
                  className="m-auto"
                  width={20}
                  height={20}
                  src={x}
                  alt="close"
                ></Image>
              </button>
            </div>
            <div className="flex justify-between mt-2 w-full">
              <div className="relative w-full">
                <textarea
                  disabled={disabledInput}
                  className={`${'min-h-[150px]'}  w-full border border-gray-300 py-2 px-3 rounded focus:outline-none text-base`}
                  id="review-text"
                  onChange={handleChange}
                  placeholder={'Enter your action description'}
                  ref={textAreaRef}
                  rows={1}
                  value={description}
                ></textarea>
                <label
                  htmlFor="review-text"
                  className={`text-xs text-center ${
                    disabledInput ? 'bg-gray-50' : 'bg-white'
                  } absolute bottom-2 left-0 mr-4 ml-1 right-3 text-red-500 pointer-events-none`}
                  style={{ zIndex: 5 }}
                >
                  <b>Return</b>&nbsp;to enter new line
                </label>
              </div>
            </div>
            <div className="mt-6 flex w-full justify-between space-x-6">
              <div className="flex w-full">
                <div className="">
                  <BoardAsigneeSelector
                    setSelectedMember={setSelectedMember}
                    selectedMember={selectedMember}
                    members={retrospective?.members}
                  />
                </div>
                <div className="my-auto">
                  {selectedMember !== '' && (
                    <button
                      className="ml-2 text-[#71717A] cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMember('');
                      }}
                    >
                      <XCircleIcon className="text-black h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="w-full cursor-pointer flex justify-end">
                <CustomDatePicker
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                />
              </div>
            </div>
            <button
              onClick={onCreateActions}
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

export default ActionContainer;
