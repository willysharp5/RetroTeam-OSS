import { useState, useCallback } from 'react';
import toaster from 'react-hot-toast';

import Image from 'next/image';

import Sidebar from '~/core/ui/SideBarComponent';

import x from 'public/assets/svg/x.svg';
import plusSquare from 'public/assets/svg/plus-square.svg';

import useAddActions from '~/lib/actions/hooks/use-add-actions';
import { default as useAddBoardActions } from '~/lib/board/hooks/use-add-actions';

import { ActionSidebarComponentProps } from '~/lib/actions/types/actions';

import CustomDatePicker from '../shared/datepicker';

import CustomTextArea from '../shared/textArea';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/Select';
import { useAuth } from 'reactfire';
import SearchableAssigneSelector from '../shared/searchableAssigneeSelector';

export default function ActionSidebarComponent({
  setShowAddActionBar,
  organizationId,
  teamId,
  refetch,
  teamMembers,
  refetchTeamMembers,
  loadingMembers,
  retrospectiveId,
  facilitator,
  createAction,
  showOrgActions,
}: ActionSidebarComponentProps) {
  const auth = useAuth();
  const currentUserId = auth.currentUser?.uid as string;
  const [description, setDescription] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState('To do');
  const [descriptionError, setDescriptionError] = useState(false);

  const { trigger: addActionsData } = useAddActions();
  const { trigger: addActionsBoardData } = useAddBoardActions();

  const onCreateActions = useCallback(async () => {
    if (description !== '') {
      const body = {
        description: description,
        assignee: selectedMember,
        organization: organizationId,
        date: selectedDate ? selectedDate : '',
        status: status,
        archive: false,
        order: -1,
        team: teamId,
        author: currentUserId,
      };
      const promise = addActionsData(body)
        .then(() => {
          setDescription('');
          setSelectedMember('');
          refetch('Any member', 'Filter by date');
          setShowAddActionBar(false);
        })
        .catch((e) => {
          console.error('ERROR onCreateActions', e);
        });
      await toaster.promise(promise, {
        loading: 'Creating action',
        success: 'Action has been created',
        error: 'Error creating action',
      });
    }
  }, [
    addActionsData,
    refetch,
    setShowAddActionBar,
    teamId,
    description,
    status,
    organizationId,
    selectedMember,
    selectedDate,
    currentUserId,
  ]);

  const onCreateBoardActions = useCallback(async () => {
    if (description !== '') {
      const body = {
        description: description,
        assignee: selectedMember,
        date: selectedDate ? selectedDate : '',
        order: -1,
        retrospectiveId: retrospectiveId,
        organization: organizationId,
        teamId: teamId,
        author: currentUserId,
        facilitator,
        status: status,
        archive: false,
        team: teamId,
      };

      const promise = addActionsBoardData(body)
        .then((res: any) => {
          if (res.success) {
            setDescription('');
            createAction(res.data);
          }
        })
        .catch((e) => {
          console.error('ERROR onCreateActions', e);
        });

      await toaster.promise(promise, {
        loading: 'Creating board action',
        success: 'Action has been created',
        error: 'Error creating action',
      });
    }
  }, [
    description,
    selectedMember,
    selectedDate,
    createAction,
    currentUserId,
    organizationId,
    teamId,
    facilitator,
    status,
    addActionsBoardData,
    retrospectiveId,
  ]);

  return (
    <Sidebar>
      <div className="z-50 shadow-lg bg-white h-full fixed top-0 right-0 overflow-y-auto p-6 w-[400px]">
        <div className="flex justify-between">
          <p className="text-sm font-black">Add new Action Item</p>
          <Image
            className="h-6 w-6 cursor-pointer"
            src={x}
            alt="x"
            onClick={() => setShowAddActionBar(false)}
          ></Image>
        </div>
        <div className="text-sm text-black mt-4 border rounded-md p-6">
          <div className="w-full flex justify-between items-center mb-2">
            <div className="w-1/2">
              <Select
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
          </div>
          <CustomTextArea
            description={description}
            setDescription={setDescription}
            enter={() => {}}
            placeholder="Enter your action description"
          />
          {descriptionError && (
            <p className="text-red-500 text-sm">
              Please fill out description field
            </p>
          )}
          <div className="flex justify-between mt-8">
            <div>
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
            <div>
              <CustomDatePicker
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            </div>
          </div>
          <button
            onClick={showOrgActions ? onCreateActions : onCreateBoardActions}
            className="flex items-center justify-center space-x-2 mt-5 bg-[#F4F4F5] rounded-md hover:bg-slate-100 px-4 py-2 w-full"
          >
            <Image src={plusSquare} alt="plusSquare"></Image>
            <p>Create</p>
          </button>
        </div>
      </div>
    </Sidebar>
  );
}
