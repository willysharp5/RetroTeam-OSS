import dynamic from 'next/dynamic';
import AdminProviders from '~/components/admin/AdminProviders';

const ReactHotToast = dynamic(async () => {
  const { Toaster } = await import('react-hot-toast');

  return Toaster;
});

function AdminRouteShell(props: React.PropsWithChildren) {
  return (
    <AdminProviders collapsed={false}>
      <ReactHotToast />
      <div className={'flex flex-1'}>
        <div
          className={
            'overflow-y-auto overflow-x-hidden relative mx-auto h-screen w-full p-4  flex flex-col md:flex-1'
          }
        >
          {props.children}
        </div>
      </div>
    </AdminProviders>
  );
}

export default AdminRouteShell;
