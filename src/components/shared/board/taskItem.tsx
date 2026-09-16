import { useEffect, useState } from 'react';
import Image from 'next/image';

import { Task } from '~/lib/actions/types/actions';

import vector from 'public/assets/svg/3-dots.svg';

import CustomDatePicker from '../datepicker';

import OrganizationAsigneeSelector from '~/components/actions/OrganizationAsigneeSelector';
import edit from 'public/assets/svg/edit-3.svg';
import trash from 'public/assets/svg/trash.svg';
import archive from 'public/assets/svg/archive.svg';
import useUpdateActions from '~/lib/actions/hooks/update-actions';
import { useAuth } from 'reactfire';

type TaskItemProps = {
  task: Task;
  organizationId: string;
  onTaskUpdate: (data: any) => void;
};

const TaskItem = ({ task, organizationId, onTaskUpdate }: TaskItemProps) => {
  let seconds, nanoseconds;

  if ('seconds' in task.date) {
    seconds = task.date.seconds;
    nanoseconds = task.date.nanoseconds;
  } else if ('_seconds' in task.date) {
    seconds = task.date._seconds;
    nanoseconds = task.date._nanoseconds;
  }

  const date = new Date(seconds * 1000 + nanoseconds / 1e6);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);

  const [selectedMember, setSelectedMember] = useState(task.assignee);

  const { trigger: updateActions } = useUpdateActions(organizationId);

  const auth = useAuth();
  const currentUserId = auth?.currentUser?.uid as string;

  useEffect(() => {
    const body = {
      id: task.id,
      description: '',
      assignee: selectedMember,
      organization: organizationId,
      date: selectedDate,
      status: task.status,
      facilitator: currentUserId,
    };

    updateActions(body)
      .then((res: any) => {
        onTaskUpdate(res.data);
      })
      .catch((e) => {
        console.log('ERROR updateActions', e);
      });
  }, [selectedMember, selectedDate]);

  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative cursor-grab">
      <div className=" bg-white p-6 border rounded-md shadow-sm">
        <div className="flex justify-between w-full">
          <p className="w-full pointer-events-none cursor-pointer">
            {task.description}
          </p>
          <button
            className="flex  w-h w-6"
            onClick={() => setShowMenu(!showMenu)}
          >
            <Image className="ml-auto" src={vector} alt="menu vector" />
          </button>
        </div>
        <div className="mt-6 flex w-full">
          <div className="w-full">
            <OrganizationAsigneeSelector
              selectedMember={selectedMember}
              setSelectedMember={setSelectedMember}
              organizationId={organizationId}
            />
          </div>
          <div className="w-full cursor-pointer xl:flex xl:justify-end">
            <CustomDatePicker
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </div>
        </div>
      </div>
      {showMenu && (
        <div className="absolute space-y-2 rounded-md py-1.5 px-2 top-10 right-10 z-50 bg-white border shadow-md">
          <div className="flex space-x-2">
            <Image src={edit} alt="edit"></Image>
            <p className="text-sm">Edit</p>
          </div>
          <div className="flex space-x-2">
            <Image src={trash} alt="delete"></Image>
            <p className="text-sm">Delete</p>
          </div>
          <div className="flex space-x-2">
            <Image src={archive} alt="archive"></Image>
            <p className="text-sm">Archive</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
