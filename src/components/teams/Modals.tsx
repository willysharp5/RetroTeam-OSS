import { FormEventHandler, useCallback, useRef } from 'react';
import toaster, { Toaster, toast } from 'react-hot-toast';

import Image from 'next/image';
import x from '/public/assets/svg/x.svg';

import { DeleteModalProps } from '~/lib/teams/types/teams';
import useDeleteTeam from '~/lib/teams/hooks/use-delete-teams';

import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useDeleteInvite } from '~/lib/organizations/hooks/use-delete-invite';

// TEAM PAGE
export function DeleteModal({
  closeModalHandler,
  team,
  organizationId,
}: DeleteModalProps) {
  const { trigger: deleteTeam } = useDeleteTeam(
    team.id || '',
    organizationId || '',
  );

  const formRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();

  function getDeepLinkPath(organizationId: string, path: string) {
    return ['', organizationId, path.slice(1, path.length)].join('/');
  }

  const value = getDeepLinkPath(organizationId as string, router.asPath);

  const DeleteTeam: FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event.preventDefault();

      const promise = deleteTeam({
        id: team.id,
        organizationId: organizationId,
      })
        .then((res: any) => {
          if (res.success === true) {
            if (formRef.current) {
              closeModalHandler();
              window.location.href = value;
            }
          } else {
            closeModalHandler();
            toaster.error(res.error);
          }
        })
        .catch((e) => {
          closeModalHandler();
          console.log('ERROR deleteTeam', e);
          toaster.error(e.error);
        });
      await toaster.promise(promise, {
        loading: 'Deleting team',
        success: 'Team has been deleted',
        error: 'Error deleting team',
      });
    },
    [closeModalHandler, deleteTeam, value, team, organizationId],
  );

  return (
    <div className="absolute">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen flex items-center justify-center">
        <div className="fixed inset-0"></div>

        <div className="fixed inset-0 flex items-center justify-center z-50">
          <form
            ref={formRef}
            onSubmit={DeleteTeam}
            className="bg-white p-6 rounded-lg shadow-lg md:w-2/6 mx-6 md:mx-0"
          >
            <div className="flex justify-between items-center mb-1.5">
              <h2 className="text-lg font-semibold">Delete</h2>
              <button onClick={(e) => closeModalHandler()}>
                <Image src={x} alt="x" />
              </button>
            </div>
            <p className="text-[#71717A]">
              You&apos;re about to delete <b>{team.name}</b> from your
              Organization. All the data related to this team will be deleted
              and you will not be able to recover it.
            </p>
            <div className="mt-4 flex justify-end space-x-2">
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
                Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// TEAM DETAIL PAGE

export function DeleteMemberModal({
  closeModalHandler,
  team,
  user,
  deleteMember,
  refetch,
}: any) {
  const formRef = useRef<HTMLFormElement | null>(null);

  const onDeleteMember: FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event?.preventDefault();
      const promise = deleteMember()
        .then((res: any) => {
          if (res.success === true) {
            if (formRef.current) {
              closeModalHandler();
              refetch(1);
            }
          } else {
            toaster.error(res.message);
            closeModalHandler();
          }
        })
        .catch((e: any) => {
          console.error('ERROR onDeletingMember', e);
          toaster.error(e.error);
          closeModalHandler();
        });
      toast.promise(
        promise,
        {
          loading: 'Removing member',
          success: 'Member removed',
          error: 'Error on removing member',
        },
        {
          style: {
            zIndex: 10000,
          },
        },
      );
    },
    [closeModalHandler, deleteMember, refetch],
  );

  return (
    <div className="absolute">
      <div className="min-h-screen flex items-center justify-center">
        <div className="fixed inset-0"></div>
        <Toaster position="top-center" reverseOrder={false} />
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
                {user.name} {user.lastName}
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

export function DeleteInvitationModal({
  closeModalHandler,
  invitation,
  organizationId,
}: any) {
  const formRef = useRef<HTMLFormElement | null>(null);

  const { t } = useTranslation('organization');

  const deleteRequest = useDeleteInvite();

  const onInviteDeleteRequested: FormEventHandler<HTMLFormElement> =
    useCallback(
      (e) => {
        e.preventDefault();
        void (async () => {
          try {
            const promise = deleteRequest(organizationId, invitation.code);

            await toaster.promise(promise, {
              success: t(`deleteInviteSuccessMessage`),
              error: t(`deleteInviteErrorMessage`),
              loading: t(`deleteInviteLoadingMessage`),
            });
            if (formRef.current) {
              formRef.current.submit();
            }
          } catch (e) {
            console.log(e);
          }
        })();
      },
      [deleteRequest, invitation, organizationId, t],
    );

  return (
    <div className="absolute">
      <div className="min-h-screen flex items-center justify-center">
        <div className="fixed inset-0"></div>
        <Toaster position="top-center" reverseOrder={false} />
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg md:w-2/6 mx-6 md:mx-0">
            <div className="flex justify-between items-center mb-1.5">
              <h2 className="text-lg font-semibold">Remove Invitation?</h2>
              <button onClick={closeModalHandler}>
                <Image src={x} alt="x" />
              </button>
            </div>
            <p className="text-[#71717A]">
              Are you sure you want to remove invitation of
              <b> {invitation.email}</b> ?
            </p>
            <form
              onSubmit={onInviteDeleteRequested}
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
                Delete
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
