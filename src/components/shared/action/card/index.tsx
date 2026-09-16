import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/router';

import { TooltipContent, Tooltip, TooltipTrigger } from '~/core/ui/Tooltip';
import If from '~/core/ui/If';

import vector from 'public/assets/svg/3-dots.svg';
import edit from '/public/assets/svg/edit-3.svg';
import trash from '/public/assets/svg/trash.svg';
import archive from '/public/assets/svg/archive.svg';
import calendar from '/public/assets/svg/calendar.svg';
import logo from 'public/assets/svg/logo-orange.svg';
import connect from '/public/assets/svg/connect.svg';
import jira from '/public/assets/svg/jira.svg';
import x from 'public/assets/svg/x.svg';
import done from '/public/assets/svg/check-semicircled.svg';

import { ArrowRightIcon, XCircleIcon } from '@heroicons/react/24/outline';

import CustomDatePicker from '../../datepicker';
import Paragraph from '../../paragraph';
import SearchableAssigneSelector from '../../searchableAssigneeSelector';

import { TeamMembers } from '~/lib/teams/types/teams';
import useFetchUserById from '~/lib/server/user/get-current-user';

import UserImage from '~/components/dashboard/UserImage';
import Modal from '~/components/shared/modal';
import { AddToJiraModal } from '../../jira/Modals';
import { useUserSession } from '~/core/hooks/use-user-session';

interface ActionCardProps {
  setEditMode: (editMode: any) => void;
  description: string;
  teamMembers: TeamMembers[] | any[] | null;
  selectedMember: string;
  setSelectedMember: (member: string) => void;
  organizationId: string;
  selectedDate: any;
  setSelectedDate: any;
  setShowDeleteModal: any;
  ArchiveAction: any;
  active: boolean;
  author: string;
  isBoard?: boolean;
  isAllowedToUpdate?: boolean;
  isAllowedToDelete?: boolean;
  setEditCard: (card: any) => void;
  editCard: any;
  id: string;
  refetchTeamMembers: any;
  loading: boolean;
  width?: string;
  isArchive: boolean;
  isSearch?: boolean;
  organizationData: any;
  teamId: string;
  jiraUrl: any;
  retrospectiveId?:string;
}

export default function Card({
  setEditMode,
  description,
  teamMembers,
  selectedMember,
  setSelectedMember,
  organizationId,
  selectedDate,
  setSelectedDate,
  setShowDeleteModal,
  ArchiveAction,
  active,
  author,
  isBoard = false,
  isAllowedToUpdate = true,
  isAllowedToDelete = true,
  setEditCard,
  id,
  refetchTeamMembers,
  loading,
  width,
  isArchive = false,
  isSearch = false,
  organizationData,
  teamId,
  jiraUrl,
  retrospectiveId
}: ActionCardProps) {
  const session = useUserSession();
  const auth = session?.auth;
  const currentUser = auth?.uid as string;

  const router = useRouter();

  const cardRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  const [showMenu, setShowMenu] = useState(false);

  const [isFocused, setIsFocused] = useState(false);

  const [isAllowedToUpdateCards, setIsAllowedToUpdate] = useState(true);
  const [isAllowedToDeleteCards, setIsAllowedToDelete] =
    useState(isAllowedToDelete);

  useEffect(() => {
    if (isAllowedToUpdate) {
      if (isBoard || isSearch) {
        setIsAllowedToUpdate(isAllowedToUpdate);
      }
    } else {
      setIsAllowedToUpdate(false);
    }
    setIsAllowedToDelete(isAllowedToDelete);
  }, [isBoard, isAllowedToUpdate, isAllowedToDelete]);

  const handleClickOutside = (event: any) => {
    if (cardRef.current && !cardRef.current.contains(event.target)) {
      setShowMenu(false);
    }
  };

  const showDeleteModalHandler = () => {
    setShowDeleteModal(true);
  };

  const [selectedMemberData, setSelectedMemberData] = useState<
    TeamMembers | undefined
  >(undefined);

  const [isDatePast, setIsDatePast] = useState(false);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const userData = useFetchUserById(selectedMember);

  useEffect(() => {
    if (userData) {
      setSelectedMemberData(userData);
    }
  }, [userData]);

  useEffect(() => {
    if (!isAllowedToUpdate) {
      const today = new Date();
      const isDatePast = selectedDate < today;
      setIsDatePast(isDatePast);
    }
  }, [teamMembers, isAllowedToUpdate, selectedMember, selectedDate]);

  const formatDate = (date: Date | undefined) => {
    if (!date) {
      return 'No due date';
    }
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  };

  const onDoubleClickEvent = () => {
    if (isAllowedToUpdateCards) {
      setEditCard(id);
      setEditMode(true);
    }
  };

  // JIRA INTEGRATION

  const [isConnected, setIsConnected] = useState('');
  const [connectModal, setConnectModal] = useState(false);
  const [addJiraModal, setAddJiraModal] = useState(false);

  useEffect(() => {
    if (organizationData && organizationData?.jiraIntegration) {
      const isConnected = organizationData.jiraIntegration.connected;
      setIsConnected(isConnected ? 'connected' : 'disconnected');
    }else{
      setIsConnected('disconnected');
    }
  }, [organizationData]);

  const handleConnect = () => {
    router.push(`/settings/integration`);
  };

  return (
    <Tooltip className="relative my-6">
      <TooltipTrigger
        asChild
        className={`bg-white hover:bg-zinc-50 p-5 border rounded-md  shadow-sm  ${
          isFocused || active ? 'border-orange-500' : ''
        } ${
          isBoard
            ? 'bg-white hover:bg-zinc-50 p-5 border rounded-md shadow-sm md:w-full'
            : ''
        } ${width ? width : isBoard ? 'w-[350px]' : 'w-[350px] tv:w-[400px]'}`}
      >
        <div className="text-left" ref={ref} onClick={() => setIsFocused(true)}>
          <div
            className={`flex justify-between w-full ${
              author === currentUser && 'space-x-2'
            }`}
          >
            <If condition={author === currentUser}>
              <div className="w-[2px] h-[34px] bg-orange-300"></div>
            </If>
            <Paragraph
              description={description}
              onDoubleClickEvent={onDoubleClickEvent}
            />
            <If condition={isAllowedToUpdateCards || isAllowedToDeleteCards}>
              <div className="relative">
                <button
                  className="flex relative  w-h w-6"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <Image className="ml-auto" src={vector} alt="menu vector" />
                </button>

                {showMenu && (
                  <div
                    ref={cardRef}
                    className="absolute space-y-2 w-max rounded-md py-1.5 px-2 top-0 right-2 z-50 bg-white border shadow-md"
                  >
                    <If condition={isAllowedToUpdateCards}>
                      <button
                        className="flex space-x-2 w-full"
                        onClick={() => setEditCard(id)}
                      >
                        <Image src={edit} alt="edit"></Image>
                        <p className="text-sm">Edit</p>
                      </button>
                    </If>
                    <If condition={isAllowedToDeleteCards}>
                      <button
                        onClick={showDeleteModalHandler}
                        className="flex space-x-2"
                      >
                        <Image src={trash} alt="delete"></Image>
                        <p className="text-sm">Delete</p>
                      </button>
                    </If>
                    {!isArchive ? (
                      <button
                        className="flex space-x-2"
                        onClick={() => {
                          ArchiveAction(true);
                          setShowMenu(false);
                        }}
                      >
                        <Image src={archive} alt="archive"></Image>
                        <p className="text-sm">Archive</p>
                      </button>
                    ) : (
                      <button
                        className="flex space-x-2"
                        onClick={() => {
                          ArchiveAction(false);
                          setShowMenu(false);
                        }}
                      >
                        <Image src={archive} alt="archive"></Image>
                        <p className="text-sm">Restore</p>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </If>
          </div>
          {isAllowedToUpdate ? (
            <div className="mt-6 flex w-full justify-between space-x-6">
              <div className="flex w-full">
                <div className="">
                  <SearchableAssigneSelector
                    refetch={refetchTeamMembers}
                    loading={loading}
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
          ) : (
            <div className="mt-6 flex w-full justify-between space-x-6">
              <div className="flex w-full">
                <div className="flex flex-auto items-center space-x-2">
                  <UserImage
                    organizationId={organizationId}
                    selectedMember={selectedMember}
                  />
                  <div className="flex-1 min-w-0 text-xs w-[10px]">
                    <p className="truncate">
                      {' '}
                      {selectedMemberData?.fullName
                        ? selectedMemberData?.fullName
                        : 'Not assigned'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full cursor-pointer flex justify-end">
                <div
                  className={`space-x-2 flex border px-2 py-2 rounded-md w-max ${
                    isDatePast ? 'bg-red-100' : ''
                  }`}
                >
                  <Image src={calendar} alt="calendar"></Image>
                  <p className="my-auto text-xs font-normal">
                    {formatDate(selectedDate)}
                  </p>
                </div>
              </div>
            </div>
          )}
          {(jiraUrl && isConnected === 'connected' ) ? (
            <a
              href={jiraUrl}
              target="_blank"
              className="mt-6 w-full space-x-2 flex justify-end"
            >
              <Image src={done} alt="done" />
              <p className="text-blue-600 hover:text-blue-400 text-xs">
                View in Jira
              </p>
            </a>
          ) : isConnected === 'connected' ? (
            <button
              onClick={() => setAddJiraModal(true)}
              className="mt-6 w-full space-x-2 flex justify-end"
            >
              <Image className="h-4 w-4" src={jira} alt="jira" />
              <p className="text-blue-600 hover:text-blue-400 text-xs">
                Add to Jira
              </p>
            </button>
          ) : (
            isConnected === 'disconnected' && (
              <button
                onClick={() => setConnectModal(true)}
                className="mt-6 w-full space-x-2 flex justify-end"
              >
                <Image src={connect} alt="connect" />
                <p className="text-blue-600 hover:text-blue-400 text-xs">
                  Connect
                </p>
              </button>
            )
          )}
        </div>
      </TooltipTrigger>
      <If condition={!active && isAllowedToUpdateCards}>
        <TooltipContent side="bottom">Double click to edit</TooltipContent>
      </If>
      {/* JIRA CONNECT MODAL*/}
      {connectModal && (
        <Modal onClose={() => setConnectModal(false)}>
          <div
            style={{ opacity: 0.7 }}
            className="absolute top-0 left-0 w-full h-full bg-black z-50 opactiy-5"
          ></div>
          <div className="absolute z-100">
            <div className="flex items-center justify-center">
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50">
                <div className="bg-gray-100  p-6 rounded-lg shadow-lg overflow-y-auto">
                  <div className="flex justify-between">
                    <div className="flex items-center space-x-2">
                      <Image className="h-9 w-9" alt="logo" src={logo}></Image>
                      <p className="text-xl font-bold text-orange-500">
                        <b>RetroTeam</b>
                      </p>
                    </div>

                    <Image
                      className="h-7 w-7 cursor-pointer"
                      src={x}
                      alt="x"
                      onClick={() => setConnectModal(false)}
                    ></Image>
                  </div>
                  <div className="space-y-6 p-10">
                    <p>
                      RetroTeam would like to access your Atlassian account.
                    </p>
                    <div className="flex justify-between">
                      <p className="text-gray-500">
                        {' '}
                        This will allow RetroTeam to:
                      </p>
                      <ArrowRightIcon className="h-8 w-4" />
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-500"> View Jira Issue data</p>
                      <ArrowRightIcon className="h-8 w-4" />
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-500"> View user profiles</p>
                      <ArrowRightIcon className="h-8 w-4" />
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-500"> Create and manage Issues</p>
                      <ArrowRightIcon className="h-8 w-4" />
                    </div>
                    <div className="mt-6 flex justify-end w-full space-x-8">
                      <button
                        onClick={() => setConnectModal(false)}
                        className="py-2 px-4"
                      >
                        Cancel
                      </button>
                      <button onClick={handleConnect} className="bg-orange-400 rounded-md py-2 px-4 text-white">
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {/*ADD TO JIRA MODAL*/}
      {addJiraModal && (
        <AddToJiraModal
          setAddJiraModal={setAddJiraModal}
          organizationData={organizationData}
          description={description}
          actionId={id}
          teamId={teamId}
          userData={session?.data}
          retrospectiveId={retrospectiveId}
        />
      )}
    </Tooltip>
  );
}
