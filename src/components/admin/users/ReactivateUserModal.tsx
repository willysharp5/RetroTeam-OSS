import useSWRMutation from 'swr/mutation';
import { useRouter } from 'next/router';

import Button from '~/core/ui/Button';
import Modal from '~/core/ui/Modal';
import { useApiRequest } from '~/core/hooks/use-api';

function ReactivateUserModal({
  userId,
  displayName,
  email,
  children,
}: React.PropsWithChildren<{
  userId: string;
  displayName: string;
  email: string;
}>) {
  const { trigger, isMutating } = useReactivateUser(userId);

  return (
    <Modal heading={'Reactivate User'} Trigger={children}>
      <div className={'flex flex-col space-y-4'}>
        <div className={'flex flex-col space-y-2 text-sm'}>
          <p>
            You are about to reactivate <b>{displayName}</b>
          </p>
          <p>{email} Account. They will not have</p>
          <p>access to login and use RetroTeam</p>
        </div>
        <div className={'flex space-x-2.5 justify-end'}>
          <button
            onClick={() => trigger()}
            type="submit"
            className="px-4 py-2 bg-black text-white rounded hover:bg-zinc-600 focus:outline-none"
          >
            Yes
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ReactivateUserModal;

function useReactivateUser(userId: string) {
  const key = `/api/admin/users/${userId}/reactivate`;
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
