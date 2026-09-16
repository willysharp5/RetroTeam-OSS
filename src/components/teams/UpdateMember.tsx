import {
  useState,
  useCallback,
  FormEventHandler,
  useRef,
  useEffect,
} from 'react';
import toaster, { Toaster } from 'react-hot-toast';
import { useAuth } from 'reactfire';
import { Trans } from 'react-i18next';

import Image from 'next/image';

import arrowLeft from 'public/assets/svg/arrow-left-black.svg';
import x from 'public/assets/svg/x.svg';

import MembershipRoleSelector from '../organizations/MembershipRoleSelector';

import Modal from '../shared/modal';

import { UpdateMemberScreenProps } from '~/lib/teams/types/teams';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import useUpdateTeamMember from '~/lib/teams/hooks/use-update-team-member';
import useUpdateTeamMemberRole from '~/lib/teams/hooks/use-update-team-member-role';
import roles from '~/lib/organizations/roles';
import useFetchUserById from '~/lib/server/user/get-current-user';
import useActiveTeamMember from '~/lib/teams/hooks/use-active-member';
import useDeactiveTeamMember from '~/lib/teams/hooks/use-deactive-member';
import useDeleteTeamMember from '~/lib/teams/hooks/use-delete-member';

import CancelContinueModal from '../shared/cancelContinueModal';
import DeleteModal from '../shared/deleteModal';
export default function UpdateMemberScreen({
  organization,
  team,
  member,
  userId,
}: UpdateMemberScreenProps) {
  const auth = useAuth();
  const user = auth.currentUser;
  const currentUserId = user?.uid ?? '';

  const [disabledName, setDisabledName] = useState(false);

  const userData = useFetchUserById(userId);

  const { trigger: updateMember } = useUpdateTeamMember(
    organization.id,
    team.id,
  );

  const { trigger: updateMemberRole } = useUpdateTeamMemberRole(
    organization.id,
    team.id,
  );

  const { trigger: deleteMember } = useDeleteTeamMember(
    organization.id,
    team.id,
    member.userId,
    member.name + ' ' + member.lastName,
    member.email ? member.email : '',
    team.name,
    userData?.name + ' ' + userData?.lastName,
    organization.name,
    currentUserId,
  );

  const { trigger: deactivateMember } = useDeactiveTeamMember(
    organization.id,
    team.id,
    member.userId,
    member.name + ' ' + member.lastName,
    member.email,
    team.name,
    userData?.name + ' ' + userData?.lastName,
    organization.name,
    currentUserId,
  );

  const { trigger: activeMember } = useActiveTeamMember(
    organization.id,
    team.id,
    member.userId,
    member.name + ' ' + member.lastName,
    member.email,
    team.name,
    userData?.name + ' ' + userData?.lastName,
    organization.name,
    currentUserId,
  );

  const onActiveMember = useCallback(async () => {
    const promise = activeMember()
      .then(() => {
        setActive(true);
      })
      .catch((e: any) => {
        console.error('ERROR onActivatingMember', e);
        toaster.error(e.error);
      });

    await toaster.promise(promise, {
      loading: 'Activating member',
      success: 'Activated member',
      error: 'Error activating member',
    });
  }, [activeMember]);

  const [memberName, setMemberName] = useState(member.name);
  const [memberLastName, setMemberLastName] = useState(member.lastName);

  const [toRole, setToRole] = useState<MembershipRole>(member.role);
  const [active, setActive] = useState(member.active);

  const [actualMemberRole, setActualMemberRole] = useState(member.role);

  const [errormemberName, setErrorMemberName] = useState(false);
  const [errorMembers, setErrorMembers] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [noRolesModal, setRolesModal] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);

  const [onlyAdmin] = useState(member.role > 0 && team.admins < 2);

  const closeModalHandler = () => {
    setDeactivateModal(false);

    const dashboardElement = document.getElementById('team-details');
    if (dashboardElement) {
      dashboardElement.removeAttribute('class');
    }
  };

  const closeDeleteModalHandler = () => {
    setDeleteModal(false);

    const dashboardElement = document.getElementById('team-details');
    if (dashboardElement) {
      dashboardElement.removeAttribute('class');
    }
  };

  const closeEditModalHandler = () => {
    setEditModal(false);

    const dashboardElement = document.getElementById('team-details');
    if (dashboardElement) {
      dashboardElement.removeAttribute('class');
    }
  };

  const closeRoleModalHandler = () => {
    setRolesModal(false);

    const dashboardElement = document.getElementById('team-details');
    if (dashboardElement) {
      dashboardElement.removeAttribute('class');
    }
  };

  useEffect(() => {
    if (user) {
      const currentUser = member.userId === user.uid;

      if (!currentUser && member.role > 0) setDisabledName(true);
    }
  }, [user, member]);

  const onUpdateMember: FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event?.preventDefault();

      if (memberName !== '' && memberLastName !== '') {
        setErrorMembers(false);

        const body = {
          id: member.userId,
          organization: organization.id,
          name: memberName,
          lastName: memberLastName,
          currentUserId,
        };

        const promise = updateMember(body)
          .then((res: any) => {
            if (res.success === false) {
              console.error(res.message);
            } else {
            }
          })
          .catch((e) => {
            console.error('ERROR onUpdateMember', e);
            toaster.error(e.error);
          });

        await toaster.promise(promise, {
          loading: 'Updating member',
          success: 'Member has been updated',
          error: 'Error updating member',
        });
      } else {
        setErrorMemberName(true);
      }
    },
    [
      currentUserId,
      organization,
      updateMember,
      member,
      memberName,
      memberLastName,
    ],
  );

  const onUpdateMemberRole = async () => {
    if (memberName !== '' && memberLastName !== '') {
      setErrorMembers(false);
      const body = {
        id: member.userId,
        organization: organization.id,
        organizationName: organization.name,
        name: memberName,
        lastName: memberLastName,
        email: member.email ? member.email : '',
        teamId: team.id,
        teamName: team.name,
        adminName: userData?.name + ' ' + userData?.lastName,
        currentUserId,
        newRole: toRole?.toString(),
      };

      const promise = updateMemberRole(body)
        .then((res: any) => {
          if (res.success === false) {
            console.error(res.message);
          } else {
            setShowTransferModal(false);
            setActualMemberRole(toRole);
          }
        })
        .catch((e) => {
          console.error('ERROR onUpdateMember', e);
          toaster.error(e.error);
        });

      await toaster.promise(promise, {
        loading: 'Updating member',
        success: 'Member has been updated',
        error: 'Error updating member',
      });
    }
  };

  function getSelectedRoleModel(currentRole: MembershipRole | undefined) {
    const role = roles.find((role) => {
      return role.value === currentRole;
    });

    return role?.label;
  }

  const showModalHandler = () => {
    setDeactivateModal(true);

    const dashboardElement = document.getElementById('team-details');
    if (dashboardElement) {
      dashboardElement.setAttribute('class', 'fixed w-full h-screen z-30');
      dashboardElement.style.backdropFilter = 'blur(2px)';
    }
  };

  const showDeleteModalHandler = () => {
    setDeleteModal(true);

    const dashboardElement = document.getElementById('team-details');
    if (dashboardElement) {
      dashboardElement.setAttribute('class', 'fixed w-full h-screen z-30');
      dashboardElement.style.backdropFilter = 'blur(2px)';
    }
  };

  const [showTransferModal, setShowTransferModal] = useState(false);

  const onDeactivateMember = useCallback(async () => {
    const promise = deactivateMember()
      .then(() => {
        setActive(false);
        closeModalHandler();
      })
      .catch((e: any) => {
        console.error('ERROR onRemovingMember', e);
        toaster.error(e.error);
      });

    await toaster.promise(promise, {
      loading: 'Deactivating member',
      success: 'Member has been deactivated',
      error: 'Error deactivating member',
    });
  }, [closeModalHandler, deactivateMember, setActive]);

  return (
    <>
      {' '}
      <div className="">
        <div className="flex justify-end">
          <div className="flex  space-x-2">
            <a
              href={`/settings/teams/${team.id}`}
              className="flex bg-[#F4F4F5] px-4 py-2 space-x-2 rounded-md hover:bg-gray-50"
            >
              <Image
                className="my-auto"
                src={arrowLeft}
                alt="arrowLeft"
              ></Image>
              <p className="text-sm">Back to member list</p>
            </a>
          </div>
        </div>
        <div className="space-y-6 mt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (member.role === 2) {
                setEditModal(true);
              } else {
                onUpdateMember(e);
              }
            }}
            ref={formRef}
            className="space-y-8 bg-gray-50 p-8"
          >
            <div className="space-y-4">
              <div className="md:flex md:space-x-8 space-y-8 md:space-y-0 justify-between ">
                <div className="w-full">
                  <p className="text-sm font-bold">Member First Name</p>
                  <input
                    disabled={disabledName}
                    onChange={(e) => setMemberName(e.target.value)}
                    value={memberName}
                    className="w-full bg-white border border-[#E4E4E7] mt-2 py-1 px-3 rounded-md disabled:bg-gray-100 disabled:text-gray-400"
                  ></input>
                </div>
                <div className="w-full">
                  <p className="text-sm font-bold">Member Last Name</p>
                  <input
                    disabled={disabledName}
                    onChange={(e) => setMemberLastName(e.target.value)}
                    value={memberLastName}
                    className="w-full bg-white border border-[#E4E4E7] mt-2 py-1 px-3 rounded-md disabled:bg-gray-100 disabled:text-gray-400"
                  ></input>
                </div>
              </div>
              <button
                type="submit"
                disabled={disabledName}
                className="text-sm bg-black hover:bg-zinc-600 disabled:bg-gray-500  py-2 mt-auto text-white px-4 rounded-md"
              >
                Update member
              </button>
              {errormemberName && (
                <p className="text-red-500">Please fill out all the fields</p>
              )}
            </div>
          </form>
          {/*     <IfHasPermissions
            condition={canUpdateTeamMemberRole}
            teamId={team.id}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                console.log('toRole', toRole);
                if (member.role === 2) {
                  setEditModal(true);
                } else {
                  setShowTransferModal(true);
                }
              }}
              ref={formRef}
              className="space-y-8 bg-gray-50 p-8"
            >
              <>
                <div className="space-y-4">
                  {onlyAdmin && (
                    <div className="text-left text-red-500">
                      <p>
                        You are the only <b>ADMIN</b> for this Team, you can
                        only update your role to <b>MEMBER</b> if there is
                        another Admin on the Team
                      </p>
                    </div>
                  )}
                  <div className="md:flex md:space-x-8 space-y-8 md:space-y-0 justify-between">
                    <div className="w-full">
                      <p className="text-sm font-bold">Change From</p>
                      <div className="bg-white mt-2 flex w-full h-10 w-full items-center justify-between rounded-md border border-[#E4E4E7] bg-transparent py-1.5 px-2.5 md:py-2 md:px-4">
                        <p>
                          <Trans
                            i18nKey={getSelectedRoleModel(actualMemberRole)}
                          />
                        </p>
                      </div>
                    </div>

                    <div className="w-full">
                      <p className="text-sm font-bold">To</p>
                      <div className="bg-white rounded-md  w-full mt-2">
                        <MembershipRoleSelector
                          disabled={onlyAdmin}
                          value={toRole}
                          onChange={setToRole}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={onlyAdmin}
                    className="text-sm bg-black hover:bg-zinc-600 disabled:bg-gray-500 py-2 mt-auto text-white px-4 rounded-md"
                  >
                    Update role
                  </button>
                </div>

                {errorMembers && (
                  <div>
                    <p className="text-red-500">Please select a role</p>
                  </div>
                )}
              </>
            </form>
            <div className="flex space-x-8 justify-end">
              {active && member.email ? (
                <button
                  disabled={member.role > 0 && onlyAdmin}
                  type="submit"
                  onClick={showModalHandler}
                  className="text-sm bg-[#EF4444] text-white px-4 py-2 rounded-md disabled:bg-zinc-500"
                >
                  Deactivate Member from Team
                </button>
              ) : !active && member.email ? (
                <button
                  disabled={false}
                  type="button"
                  onClick={onActiveMember}
                  className="text-sm bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-md disabled:bg-zinc-500"
                >
                  Reactivate Member
                </button>
              ) : (
                <button
                  disabled={false}
                  type="button"
                  onClick={showDeleteModalHandler}
                  className="text-sm bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-md disabled:bg-zinc-500"
                >
                  Remove from team
                </button>
              )}
            </div>
          </IfHasPermissions>*/}
        </div>
      </div>
      {deactivateModal && (
        <DeleteModal
          title="Deactivate From Team?"
          message={`<p className="text-[#71717A]">
             You&apos;re about to deactivate 
             <b>
               ${member.name} ${member.lastName}
             </b> 
             from <b>${team.name}</b> Members deactivated from a team
             can&apos;t access this team&apos;s dashboard anymore.
           </p>`}
          confirmMessage="Deactivate"
          cancelMessage="Cancel"
          showModal={deactivateModal}
          setShowModal={() => {
            setDeactivateModal(true);
          }}
          confirmAction={onDeactivateMember}
          cancelAction={closeModalHandler}
          typeMessage="html"
        />
      )}
      {deleteModal && (
        <Modal onClose={closeDeleteModalHandler}>
          <DeleteMemberModal
            member={member}
            closeModalHandler={closeDeleteModalHandler}
            team={team}
            deleteMember={deleteMember}
          />
        </Modal>
      )}
      {editModal && (
        <Modal onClose={closeEditModalHandler}>
          <EditModal
            closeModalHandler={closeEditModalHandler}
            onUpdateMember={onUpdateMember}
          />
        </Modal>
      )}
      {noRolesModal && (
        <Modal onClose={closeRoleModalHandler}>
          <RoleModal closeModalHandler={closeRoleModalHandler} />
        </Modal>
      )}
   {/*   <CancelContinueModal
        title="Transfer roles"
        message={`<p>Are you sure you want to change role from <b>${
          actualMemberRole === 0 ? 'Member' : 'Admin'
        }</b> to <b>${toRole === 0 ? 'Member' : 'Admin'}</b> role?</p>`}
        showModal={showTransferModal}
        setShowModal={setShowTransferModal}
        confirmAction={onUpdateMemberRole}
        typeMessage="html"
        confirmMessage="Transfer"
      />*/}
    </>
  );
}
/*
function DeactivateModal({
  closeModalHandler,
  member,
  team,
  deactivateMember,
  setActive,
}: any) {
  const formRef = useRef<HTMLFormElement | null>(null);


  return (
    <div className="absolute">
      <div className="min-h-screen flex items-center justify-center">
        <div className="fixed inset-0"></div>
        <Toaster position="top-center" reverseOrder={false}></Toaster>
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-2/6">
            <div className="flex justify-between items-center mb-1.5">
              <h2 className="text-lg font-semibold">Deactivate From Team?</h2>
              <button onClick={(e) => closeModalHandler()}>
                <Image src={x} alt="x" />
              </button>
            </div>
            <p className="text-[#71717A]">
              You&apos;re about to deactivate{' '}
              <b>
                {member.name} {member.lastName}
              </b>{' '}
              from <b>{team.name}</b>. Members deactivated from a team
              can&apos;t access this team&apos;s dashboard anymore.
            </p>
            <form
              onSubmit={onDeactivateMember}
              ref={formRef}
              className="mt-4 flex justify-end space-x-2"
            >
              <button
                type="button"
                onClick={closeModalHandler}
                className="px-4 py-2 bg-white border text-black rounded hover:bg-zinc-100 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#EF4444] text-white rounded hover:bg-red-600 focus:outline-none"
              >
                Deactivate
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}*/

function DeleteMemberModal({
  closeModalHandler,
  member,
  team,
  deleteMember,
}: any) {
  const formRef = useRef<HTMLFormElement | null>(null);

  const onDeleteMember: FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event?.preventDefault();

      const promise = deleteMember()
        .then(() => {
          if (formRef.current) {
            closeModalHandler();
            formRef.current.submit();
          }
        })
        .catch((e: any) => {
          console.error('ERROR onRemovingMember', e);
          toaster.error(e.error);
        });

      await toaster.promise(promise, {
        loading: 'Removing member',
        success: 'Member has been removed',
        error: 'Error removing member',
      });
    },
    [closeModalHandler, deleteMember],
  );
  return (
    <div className="absolute">
      <div className="min-h-screen flex items-center justify-center">
        <div className="fixed inset-0"></div>
        <Toaster position="top-center" reverseOrder={false}></Toaster>
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg md:w-2/6 mx-6 md:mx-0">
            <div className="flex justify-between items-center mb-1.5">
              <h2 className="text-lg font-semibold">Remove From Team?</h2>
              <button onClick={(e) => closeModalHandler()}>
                <Image src={x} alt="x" />
              </button>
            </div>
            <p className="text-[#71717A]">
              You&apos;re about to remove{' '}
              <b>
                {member.name} {member.lastName}
              </b>{' '}
              from <b>{team.name}</b>. Members removed from a team can&apos;t
              access this team&apos;s dashboard anymore.
            </p>
            <form
              onSubmit={onDeleteMember}
              ref={formRef}
              className="mt-4 flex justify-end space-x-2"
            >
              <button
                type="button"
                onClick={closeModalHandler}
                className="px-4 py-2 bg-white border text-black rounded hover:bg-zinc-100 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#EF4444] text-white rounded hover:bg-red-600 focus:outline-none"
              >
                Remove
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ closeModalHandler, onUpdateMember }: any) {
  return (
    <div className="absolute">
      <div className="min-h-screen flex items-center justify-center">
        <div className="fixed inset-0"></div>

        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg md:w-2/6 mx-6 md:mx-0">
            <div className="flex justify-between items-center mb-1.5">
              <h2 className="text-lg font-semibold"></h2>
              <button onClick={(e) => closeModalHandler()}>
                <Image src={x} alt="x" />
              </button>
            </div>
            <p className="text-[#71717A]">
              A CHANGE TO YOUR ACCOUNT WILL NOT AFFECT PAYMENT, YOU WILL NEED TO
              MAKE CHANGES TO PAYMENT INFORMATION IF YOU DO NOT WANT TO GET
              CHARGED
            </p>
            <form
              onSubmit={onUpdateMember}
              className="mt-4 flex justify-end space-x-2"
            >
              <button
                onClick={closeModalHandler}
                className="px-4 py-2 bg-white border text-black rounded hover:bg-zinc-100 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded hover:bg-zinc-600 focus:outline-none"
              >
                Edit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleModal({ closeModalHandler }: any) {
  return (
    <div className="absolute">
      <div className="min-h-screen flex items-center justify-center">
        <div className="fixed inset-0"></div>

        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg md:w-2/6 mx-6 md:mx-0">
            <div className="flex justify-between items-center mb-1.5">
              <h2 className="text-lg font-semibold">Update Member Settings</h2>
              <button onClick={(e) => closeModalHandler()}>
                <Image src={x} alt="x" />
              </button>
            </div>
            <p className="text-[#71717A]">
              A CHANGE TO YOUR ACCOUNT WILL NOT AFFECT PAYMENT, YOU WILL NEED TO
              MAKE CHANGES TO PAYMENT INFORMATION IF YOU DO NOT WANT TO GET
              CHARGED
            </p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={closeModalHandler}
                className="px-4 py-2 bg-white border text-black rounded hover:bg-zinc-100 focus:outline-none"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
