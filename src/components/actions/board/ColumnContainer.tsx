import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import toaster from 'react-hot-toast';
import { useAuth } from 'reactfire';

import Image from 'next/image';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import expand from 'public/assets/svg/expand.svg';
import plusSquare from 'public/assets/svg/plus-square.svg';
import add from 'public/assets/svg/plus-black.svg';
import x from 'public/assets/svg/x.svg';

import {
  Task,
  ColumnContainerProps,
  AddActionCardProps,
  ActionsPopoverProps,
} from '~/lib/actions/types/actions';
import useAddActions from '~/lib/actions/hooks/use-add-actions';

import TaskCard from './TaskCard';
import ActionCard from './ActionCard';

import Modal from '~/components/shared/modal';
import CustomDatePicker from '~/components/shared/datepicker';

import { XCircleIcon } from '@heroicons/react/24/outline';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/Select';
import SearchableAssigneSelector from '~/components/shared/searchableAssigneeSelector';

function ColumnContainer({
  column,
  createTask,
  tasks,
  deleteTask,
  updateTask,
  organizationId,
  teamId,
  archiveTask,
  teamMembers,
  showCard,
  setShowCard,
  editCard,
  setEditCard,
  refetchTeamMembers,
  loading,
  organizationData,
}: ColumnContainerProps) {
  const [showPopOver, setShowPopOver] = useState(false);
  const [columnFilter, setColumnFilter] = useState('');

  const tasksIds = useMemo(() => {
    return tasks && tasks.map((task) => task.id);
  }, [tasks]);

  const closeModalHandler = () => {
    setShowPopOver(false);
  };

  const showPopOverHandler = (column: any) => {
    setShowPopOver(true);
    setColumnFilter(column);
  };

  const { setNodeRef, transform, transition } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
    disabled: false,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [showCard]);

  const createActionHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowCard(column.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id="action-container"
      className="rounded-md flex flex-col"
    >
      <div>
        <div
          id="action-container"
          className="flex w-[350px] tv:w-[400px] mx-2 bg-orange-500 text-white rounded-[5px] p-2.5 justify-between"
        >
          <div className="my-auto">
            <h6 className="font-bold ">{column.title}</h6>
          </div>
          <div className="flex space-x-2.5">
            <button
              onClick={() => {
                if (tasks?.length > 0) showPopOverHandler(column.id);
              }}
              className="w-9 h-9 rounded-md bg-white"
            >
              <Image src={expand} className="m-auto" alt="expand" />
            </button>
            <div className="p-4 w-9 h-9 rounded-md bg-[#F4F4F5] flex justify-center items-center">
              <p className="text-sm text-black">
                {Array.isArray(tasks) ? tasks.length : 0}
              </p>
            </div>
          </div>
        </div>
      </div>
      <button
        id="action-container"
        onClick={(e) => createActionHandler(e)}
        className="border bg-white md:w-[350px] tv:w-[400px] mx-2 rounded-md p-2 flex space-x-2 items-center my-4 relative"
      >
        <Image
          src={add}
          alt="add"
          style={{ width: '16px', height: '16px', pointerEvents: 'none' }}
        />
        <p className="text-sm text-[#71717A]"> Add in {column.title} Action</p>
      </button>
      {showCard && (
        <div className="mx-auto">
          <Card
            teamId={teamId}
            teamMembers={teamMembers}
            organizationId={organizationId}
            createTask={createTask}
            setShowCard={setShowCard}
            column={column}
            textAreaRef={textAreaRef}
            refetchTeamMembers={refetchTeamMembers}
            loadingMembers={loading}
          ></Card>
        </div>
      )}
      <div className="max-h-[840px] overflow-y-auto">
        <div className="space-y-4 mx-2">
          {tasks && (
            <SortableContext items={tasksIds}>
              {tasks.map((task, index) => (
                <TaskCard
                  teamId={teamId}
                  archiveTask={archiveTask}
                  organizationId={organizationId}
                  key={task.id}
                  action={task}
                  deleteTask={deleteTask}
                  updateTask={updateTask}
                  index={index + column.title}
                  teamMembers={teamMembers}
                  editCard={editCard}
                  setEditCard={setEditCard}
                  refetchTeamMembers={refetchTeamMembers}
                  loading={loading}
                  organizationData={organizationData}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </div>
      {showPopOver && (
        <Modal onClose={closeModalHandler}>
          <div
            style={{ opacity: 0.7 }}
            className="absolute top-0 left-0 w-full h-full bg-black z-50 opactiy-5"
          ></div>
          <ActionsPopover
            tasks={tasks}
            archiveTask={archiveTask}
            organizationId={organizationId}
            teamId={teamId}
            deleteTask={deleteTask}
            updateTask={updateTask}
            closeModalHandler={closeModalHandler}
            columnFilter={columnFilter}
            teamMembers={teamMembers}
            setEditCard={setEditCard}
            editCard={editCard}
            refetchTeamMembers={refetchTeamMembers}
            loadingMembers={loading}
            organizationData={organizationData}
          ></ActionsPopover>
        </Modal>
      )}
    </div>
  );
}

function Card({
  teamId,
  teamMembers,
  column,
  organizationId,
  createTask,
  setShowCard,
  textAreaRef,
  refetchTeamMembers,
  loadingMembers,
}: AddActionCardProps) {
  const auth = useAuth();
  const currentUserId = auth.currentUser?.uid as string;

  const { trigger: addActionsData } = useAddActions();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedMember, setSelectedMember] = useState<any>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState(column.id);
  const [disabledInput, setDisableInput] = useState(false);

  const onCreateActions = useCallback(async () => {
    if (description !== '') {
      setDisableInput(true);
      const body = {
        description: description,
        assignee: selectedMember,
        organization: organizationId,
        team: teamId,
        date: selectedDate ? selectedDate : '',
        status: status,
        archive: false,
        order: -1,
        author: currentUserId,
      };

      const promise = addActionsData(body)
        .then((res: any) => {
          if (res.success) {
            setDescription('');
            createTask(res.data);
            setShowCard(false);
          }
          setDisableInput(false);
        })
        .catch((e) => {
          console.log('ERROR onCreateActions', e);
          setDisableInput(false);
        });

      await toaster.promise(promise, {
        loading: 'Creating action',
        success: 'Action has been created',
        error: 'Error creating action',
      });
    } else {
      setShowCard(false);
      setDisableInput(false);
    }
  }, [
    description,
    selectedMember,
    organizationId,
    teamId,
    selectedDate,
    status,
    currentUserId,
    addActionsData,
    createTask,
    setShowCard,
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
  }, [textAreaRef, description, selectedMember, selectedDate, onCreateActions]);

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
      className="md:w-[350px] tv:w-[400px] mb-4"
      id={`new card`}
    >
      <div className="relative cursor-grab">
        <div className="bg-white hover:bg-zinc-50 p-5 border rounded-md mx-6 md:mx-0 shadow-sm w-[350px] tv:w-[400px]">
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
              className="h-8 w-8 cursor-pointer"
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
                <SearchableAssigneSelector
                  refetch={refetchTeamMembers}
                  loading={loadingMembers}
                  options={teamMembers}
                  label="fullName"
                  handleChange={setSelectedMember}
                  selectedVal={selectedMember}
                  organizationId={organizationId}
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
  );
}

function ActionsPopover({
  tasks,
  closeModalHandler,
  archiveTask,
  organizationId,
  teamId,
  deleteTask,
  updateTask,
  columnFilter,
  teamMembers,
  editCard,
  setEditCard,
  refetchTeamMembers,
  loadingMembers,
  organizationData,
}: ActionsPopoverProps) {
  const popOverTasks = tasks.filter((task: Task) => {
    return task.status === columnFilter;
  });

  return (
    <div className="absolute z-100">
      <div className="flex items-center justify-center">
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50">
          <div className="bg-gray-100 w-[90%] h-[90%] p-6 rounded-lg shadow-lg overflow-y-auto">
            <div className="flex justify-between">
              <p className="text-xl font-medium">{columnFilter}</p>
              <Image
                className="h-7 w-7 cursor-pointer"
                src={x}
                alt="x"
                onClick={closeModalHandler}
              ></Image>
            </div>
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4 m-auto overflow-auto h-[90%]">
              {popOverTasks &&
                popOverTasks.map((task: Task, index: number) => (
                  <div key={index}>
                    <ActionCard
                      index={index}
                      archiveTask={archiveTask}
                      organizationId={organizationId}
                      teamId={teamId}
                      action={task}
                      deleteTask={deleteTask}
                      updateTask={updateTask}
                      teamMembers={teamMembers}
                      editCard={editCard}
                      setEditCard={setEditCard}
                      refetchTeamMembers={refetchTeamMembers}
                      loadingMembers={loadingMembers}
                      organizationData={organizationData}
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

export default ColumnContainer;
