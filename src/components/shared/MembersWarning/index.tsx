import useFetchOrganizationMembers from '~/lib/server/organizations/get-members';

const MembersWarning = ({ organizationId }: any) => {
  const { allAdmins } = useFetchOrganizationMembers(organizationId, 5, false);

  return (
    <div className="bg-[#E3F3894D] p-2.5 rounded-md space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-xl font-medium">You Cannot Access these Features</p>
      </div>
      <div className="text-sm">
        <p className="font-medium font-semibold">
          Because you are not the admin for this page
        </p>
        <p className="text-[#71717A]">
          Please contact your admin{' '}
          <b>{allAdmins?.map((item) => item.fullName).join(', ')}</b> to give
          you admin access
        </p>
      </div>
    </div>
  );
};

export default MembersWarning;
