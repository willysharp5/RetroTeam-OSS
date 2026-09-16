import React, { useState, useCallback } from 'react';
import toaster from 'react-hot-toast';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import TaskItem from './taskItem';
import SortableTaskItem from './sortableTaskItem';

import Image from 'next/image';

import { Task } from '~/lib/actions/types/actions';

import add from 'public/assets/svg/plus-black.svg';
import expand from 'public/assets/svg/expand.svg';
import useAddActions from '~/lib/actions/hooks/use-add-actions';

type BoardSectionProps = {
  id: string;
  title: string;
  tasks: Task[];
  organizationId: string;
  refetch: () => void;
  onTaskUpdate: (data: any) => void;
};

const BoardSection = ({
  id,
  title,
  tasks,
  organizationId,
  refetch,
  onTaskUpdate,
}: BoardSectionProps) => {
  const { setNodeRef } = useDroppable({
    id,
  });

  const [description, setDescription] = useState('');

  const { trigger: addActionsData } = useAddActions();

  const onCreateActions = useCallback(async () => {
    if (description !== '') {
      const body = {
        description: description,
        assignee: '',
        organization: organizationId,
        date: new Date(),
        status: title,
        archive: false,
      };

      const promise = addActionsData(body)
        .then(() => {
          setDescription('');
          refetch();
        })
        .catch((e) => {
          console.log('ERROR onCreateActions', e);
        });

      await toaster.promise(promise, {
        loading: 'Creating action',
        success: 'Action has been created',
        error: 'Error creating action',
      });
    }
  }, [description, organizationId, addActionsData, refetch, title]);

  return (
    <div className="">
      <div className="flex bg-[#f973161a] p-2.5 justify-between">
        <div className="my-auto">
          <h6 className="font-bold ">{title}</h6>
        </div>
        <div className="flex space-x-2.5">
          <button className="w-9 h-9 rounded-md bg-white">
            <Image src={expand} className="m-auto" alt="expand" />
          </button>
          <div className="p-4 w-9 h-9 rounded-md bg-[#F4F4F5] flex justify-center items-center">
            <p className="text-sm">{Array.isArray(tasks) ? tasks.length : 0}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center my-4 relative">
        <input
          className="w-full border px-3 py-2 rounded-md pl-8"
          placeholder={`Add in ${title} Action`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onCreateActions();
            }
          }}
        ></input>
        <Image
          className="absolute left-2"
          src={add}
          alt="add"
          style={{ width: '16px', height: '16px', pointerEvents: 'none' }}
        />
      </div>
      {Array.isArray(tasks) && (
        <SortableContext
          id={id}
          items={tasks}
          strategy={verticalListSortingStrategy}
        >
          <div ref={setNodeRef}>
            {tasks &&
              tasks.map((task) => (
                <div key={task.id}>
                  <SortableTaskItem id={task.id}>
                    <TaskItem
                      organizationId={organizationId}
                      task={task}
                      onTaskUpdate={onTaskUpdate}
                    />
                  </SortableTaskItem>
                </div>
              ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
};

export default BoardSection;
