import Logo from 'public/assets/svg/LogoText.svg';
import Layout from '~/core/ui/Layout';
import Link from 'next/link';
import Image from 'next/image';
import Button from '~/core/ui/Button';
import { useEffect } from 'react';
import { useGetBoardByRetrospectiveId } from '~/lib/board/hooks/use-get-board-by-retrospective';
import { useRouter } from 'next/router';
import { TeamMembers } from '~/lib/teams/types/teams';
import { useAuth } from 'reactfire';

const RemovedPage = () => {
  const router = useRouter();

  const { id, organization } = router.query;
  const organizationId = organization as string;

  const retrospectiveId = id as string;

  const auth = useAuth();
  const currentUser = auth.currentUser;
  const { members } = useGetBoardByRetrospectiveId(
    organizationId,
    retrospectiveId,
  );

  function redirectToBoardPage(id: string) {
    router.push(`/board/${id}`);
  }

  // Check user's current status
  useEffect(() => {
    if (members) {
      const findUserById = (): TeamMembers | undefined => {
        return members.find(
          (member: TeamMembers) => member.userId === currentUser?.uid,
        );
      };
      const userFound = findUserById();
      if (userFound) {
        if (userFound.active) {
          redirectToBoardPage(retrospectiveId);
        }
      }
    }
  }, [members, currentUser, redirectToBoardPage]);

  return (
    <Layout>
      <div className="py-4 px-6 border-b border-[#E4E4E7]">
        <Link href={'/dashboard'} className="flex">
          <Image alt="logo" src={Logo} width={107}></Image>
        </Link>
      </div>
      <div
        style={{ marginBottom: 100 }}
        className={'flex justify-center items-center h-screen'}
      >
        <div className="border md:px-[100px] py-6 rounded-lg  px-16 ">
          <div className={'w-full max-w-xl m-auto'}>
            <p className="text-xl text-center font-semibold mb-1.5">
              You don&apos;t have access to this board
            </p>
            <div>
              <p className={'text-center text-zinc-500 text-sm mb-10'}>
                You have been removed from this board
              </p>
              <Link href={'/dashboard'}>
                <Button
                  className="flex w-full justify-center"
                  color={'secondary'}
                >
                  Return to dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RemovedPage;
