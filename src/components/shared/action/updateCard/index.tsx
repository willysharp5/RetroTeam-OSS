import { useRef, useState } from 'react';
import Image from 'next/image';

import x from '/public/assets/svg/x.svg';
import update from '/public/assets/svg/update.svg';

import { XCircleIcon } from '@heroicons/react/24/outline';
import CustomDatePicker from '../../datepicker';
import { TeamMembers } from '~/lib/teams/types/teams';
import CustomTextArea from '../../textArea';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/Select';
import If from '~/core/ui/If';
import SearchableAssigneSelector from '../../searchableAssigneeSelector';

interface UpdateActionCardProps {
  status?: string;
  setStatus?: (status: string) => void;
  description: string;
  setDescription: (description: string) => void;
  teamMembers: TeamMembers[] | any[] | null;
  selectedMember: string;
  setSelectedMember: (member: string) => void;
  organizationId: string;
  index: any;
  selectedDate: any;
  setSelectedDate: any;
  setShowDeleteModal: any;
  UpdateAction: any;
  isBoard?: boolean;
  hasCloseButton?: boolean;
  setEditCard: (card: any) => void;
  refetchTeamMembers: (name: string) => void;
  loading: boolean;
  width?:string;
}

export default function UpdateActionCard({
  status,
  setStatus,
  description,
  setDescription,
  teamMembers,
  selectedMember,
  setSelectedMember,
  organizationId,
  selectedDate,
  setSelectedDate,
  UpdateAction,
  isBoard = false,
  hasCloseButton = true,
  setEditCard,
  refetchTeamMembers,
  loading,
  width
}: UpdateActionCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [isFocused, setIsFocused] = useState(true);

  return (
    <div className="relative">
      <div
        ref={ref}
        className={`bg-white hover:bg-zinc-50 p-5 border rounded-md mx-6 md:mx-0 shadow-sm  ${
          isFocused && 'border-orange-500'
        } ${
          isBoard
            ? 'bg-white hover:bg-zinc-50 p-5 border rounded-md shadow-sm w-[350px] md:w-full'
            : width ? width : 'w-[350px] tv:w-[400px]'
        }`}
        onClick={() => setIsFocused(true)}
        onDoubleClick={() => setEditCard('')}
      >
        <div className="w-full flex justify-between items-center">
          <div className="w-1/2">
            <Select
              value={status}
              onValueChange={(value) => {
                if (setStatus) setStatus(value);
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
          <If condition={hasCloseButton}>
            <button
              className="h-8 w-8 "
              onClick={(e) => {
                e.stopPropagation();
                setEditCard('');
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
          </If>
        </div>
        <div className="mt-2 flex justify-between w-full">
          <CustomTextArea
            description={description}
            setDescription={setDescription}
            enter={() => {}}
            placeholder="Enter your action description"
          />
        </div>
        <div className="mt-6 flex w-full space-x-2 justify-between">
          <div className="flex">
            <SearchableAssigneSelector
              refetch={refetchTeamMembers}
              loading={loading}
              options={teamMembers}
              label="fullName"
              handleChange={setSelectedMember}
              selectedVal={selectedMember}
              organizationId={organizationId}
            />
            {selectedMember != '' && (
              <button
                className="text-black ml-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMember('');
                }}
              >
                <XCircleIcon className="text-black h-5 w-5" />
              </button>
            )}
          </div>
          <div className="cursor-pointer xl:flex xl:justify-end">
            <CustomDatePicker
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </div>
        </div>
        <button
          onClick={() => {
            UpdateAction(false);
          }}
          className="flex items-center justify-center space-x-2 mt-5 bg-[#F4F4F5] rounded-md hover:bg-gray-50 px-4 py-2 w-full text-sm font-medium"
        >
          <Image src={update} alt="plusSquare"></Image>
          <p>Update</p>
        </button>
      </div>
    </div>
  );
}
