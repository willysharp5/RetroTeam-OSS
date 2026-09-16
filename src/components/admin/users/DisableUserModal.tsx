import { useRouter } from 'next/router';
import useSWRMutation from 'swr/mutation';

import Modal from '~/core/ui/Modal';
import { useApiRequest } from '~/core/hooks/use-api';

function DisableUserModal({
  userId,
  displayName,
  email,
  children,
}: React.PropsWithChildren<{
  userId: string;
  email: string;
  displayName: string;
}>) {
  const { trigger, isMutating } = useDisableUser(userId);

  return (
    <Modal heading={'Ban User'} Trigger={children}>
      <div className={'flex flex-col space-y-4'}>
        <div className={'flex flex-col space-y-2 text-sm'}>
          <p>
            Are you sure you want to ban <b>{displayName}</b>{' '}
            {email != '' && `(${email})`} Account. They will not be able to log
            in or use their account on RetroTeam until you make the account
            active again.
          </p>
        </div>

        <div className={'flex space-x-2.5 justify-end'}>
          <button
            onClick={() => trigger()}
            type="submit"
            className="px-4 py-2 bg-[#EF4444] text-white rounded hover:bg-red-600 focus:outline-none"
          >
            Yes
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default DisableUserModal;

function useDisableUser(userId: string) {
  const key = `/api/admin/users/${userId}/disable`;
  const fetcher = useApiRequest();
  const router = useRouter();

  return useSWRMutation(
    key,
    (path) => {
      return fetcher({
        path,
        method: 'POST',
      });
    },
    {
      onSuccess: () => {
        router.reload();
      },
    },
  );
}
