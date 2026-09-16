import { useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth, useStorage } from 'reactfire';
import { Trans, useTranslation } from 'next-i18next';
import { useForm } from 'react-hook-form';

import {
  deleteObject,
  FirebaseStorage,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';

import { OrganizationContext } from '~/lib/contexts/organization';
import { useUpdateOrganization } from '~/lib/organizations/hooks/use-update-organization';
import { Organization } from '~/lib/organizations/types/organization';

import Button from '~/core/ui/Button';
import TextField from '~/core/ui/TextField';
import plus from 'public/assets/svg/plus-circled.svg';
import update from 'public/assets/svg/update-white.svg';
import trash from 'public/assets/svg/trash-white.svg';

import Image from 'next/image';
import OrganizationInvitedMembersList from './OrganizationInvitedMembersList';

import AddAdminsModal from './AddAdminsModal';

import { useUserSession } from '~/core/hooks/use-user-session';
import DeleteModal from '../shared/deleteModal';

import { useCurrentUserRole } from '~/lib/organizations/hooks/use-current-user-role';

import useFetchRules from '~/lib/server/rules/get-rules';
import If from '~/core/ui/If';

import AnonymousWarning from '../shared/anonymousWarning';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import OrganizationMembersList from './OrganizationMembersList';
import { useGetOrganizationById } from '~/lib/organizations/hooks/use-get-organization-by-id';

import useDisableAccount from '~/lib/users/hooks/use-disable-account';
import { useCurrentTeam } from '~/lib/organizations/hooks/use-current-team';
import { useFetchAcceptedInvitedMembers } from '~/lib/organizations/hooks/use-fetch-accepted-invites';

const UpdateOrganizationForm = () => {
  const storage = useStorage();

  const { organization, setOrganization } = useContext(OrganizationContext);
  const organizationId = organization?.id as string;

  const { team } = useCurrentTeam();
  const teamId = team?.id as string;

  const { organization: organizationData } =
    useGetOrganizationById(organizationId);

  const { totalInvitations } = useFetchAcceptedInvitedMembers(
    organization?.id as string,
  );

  const [organizationInvites, setOrganizationInvites] = useState(0);
  
  useEffect(() => {
    if (totalInvitations) setOrganizationInvites(totalInvitations);
  }, [totalInvitations]);

  const currentOrganizationName = organizationData?.name ?? '';
  const currentLogoUrl = organizationData?.logoURL || null;

  const auth = useAuth();
  const currentUser = auth.currentUser;
  const isAnonymous = currentUser?.isAnonymous || !currentUser?.email;

  const [totalPendingInvites, setTotalPendingInvites] = useState(0);

  const [updateOrganization, { loading }] = useUpdateOrganization();

  const { data: rules } = useFetchRules('organizations');

  const [logoIsDirty] = useState(false);
  const { t } = useTranslation('organization');

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      name: currentOrganizationName,
      logoURL: currentLogoUrl,
      updatedBy: currentUser?.uid
    },
  });

  const currentUserRole = useCurrentUserRole() as number;

  const { trigger: disableAccount } = useDisableAccount(
    currentUser?.uid as string,
    organizationId,
  );

  const [totalAdmins, setTotalAdmins] = useState(0);

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const onSubmit = useCallback(
    async (organizationName: string, logoFile: Maybe<File>) => {
      const organizationId = organization?.id;

      if (!organizationId) {
        return toast.error(t(`updateOrganizationErrorMessage`));
      }

      const logoName = logoFile?.name;

      const logoURL = logoName
        ? await uploadLogo({
            logo: logoFile,
            storage,
            organizationId,
          })
        : currentLogoUrl;

      const isLogoRemoved = logoIsDirty && !logoName;

      // delete existing logo if different
      if (isLogoRemoved && currentLogoUrl) {
        try {
          await deleteObject(ref(storage, currentLogoUrl));
        } catch (e) {
          // old logo not found
        }
      }

      const organizationData: WithId<Partial<Organization>> = {
        id: organization.id,
        name: organizationName,
        logoURL: isLogoRemoved ? null : logoURL,
        updatedBy: currentUser?.uid as string
      };

      const promise = updateOrganization(organizationData).then(() => {
        setOrganization({
          ...organization,
          ...organizationData,
        });
      });

      await toast.promise(promise, {
        loading: t(`updateOrganizationLoadingMessage`),
        success: t(`updateOrganizationSuccessMessage`),
        error: t(`updateOrganizationErrorMessage`),
      });
    },
    [
      logoIsDirty,
      currentLogoUrl,
      organization,
      setOrganization,
      storage,
      t,
      updateOrganization,
      currentUser
    ],
  );

  async function onDeactivateAccount() {
    const promise = disableAccount().then((res: any) => {
      auth.signOut();
    });
    await toast.promise(promise, {
      loading: 'Deactivating account',
      success: 'Account has been deactivated',
      error: 'Error deactivating account',
    });
  }

  useEffect(() => {
    reset({
      name: organizationData?.name,
      logoURL: organizationData?.logoURL,
      updatedBy: currentUser?.uid
    });
  }, [organizationData, reset]);

  const nameControl = register('name', {
    required: true,
  });

  const user = useUserSession();
  const facilitator = user?.data?.name + ' ' + user?.data?.lastName;
  const showAdminModalHandler = () => {
    if (rules?.maxAdmins - totalAdmins - totalPendingInvites > 0) {
      setShowAdminModal(true);
    } else {
      toast.error('You have reached the maximum Admin Invites you can send.');
    }
  };

  const [allowedAdmins, setAllowedAdmins] = useState(0);

  useEffect(() => {
    if (rules) {
      setAllowedAdmins(rules?.maxAdmins - totalAdmins - totalPendingInvites);
    }
  }, [rules, totalAdmins, totalPendingInvites]);

  if (isAnonymous) {
    return <AnonymousWarning />;
  }

  return (
    <div className="space-y-10">
      {showAdminModal && (
        <AddAdminsModal
          setShowAdminModal={setShowAdminModal}
          allowedAdmins={allowedAdmins}
        />
      )}
      <DeleteModal
        title="WARNING!!!"
        typeMessage="html"
        message={` <p className="text-[#71717A]">Delete and Deactivate your Account <br/> Delete this <b>${organizationData?.name}</b> organization will remove all teams, members and data from this organization. You will not be able to recover this data.</p>`}
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        confirmMessage="Delete"
        cancelMessage="Cancel"
        cancelAction={() => setShowDeleteModal(false)}
        confirmAction={onDeactivateAccount}
      />
      <form
        onSubmit={handleSubmit((value) => {
          return onSubmit(value.name, getLogoFile(value.logoURL));
        })}
        className={'space-y-4'}
      >
        <div className={'flex flex-col space-y-4'}>
          <TextField>
            <TextField.Label>
              <Trans i18nKey={'organization:organizationNameInputLabel'} />

              <TextField.Input
                {...nameControl}
                data-cy={'organization-name-input'}
                required
                disabled={currentUserRole === MembershipRole.Member}
                placeholder={'ex. IndieCorp'}
              />
              <If condition={currentUserRole > MembershipRole.Member}>
                <p className="text-xs text-[#71717A] font-normal">
                  Update your organization name
                </p>
              </If>
            </TextField.Label>
          </TextField>
          <If condition={currentUserRole > MembershipRole.Member}>
            <Button
              className={'w-28 flex'}
              data-cy={'update-organization-submit-button'}
              loading={loading}
            >
              <Image className="mr-2" src={update} alt="update"></Image>
              <p>Update</p>
            </Button>
          </If>
        </div>
      </form>
      <If condition={currentUserRole === MembershipRole.Admin}>
        <div className="border-t pt-10 space-y-4">
          <p className="text-xl font-medium">WARNING!!!</p>
          <p className="text-sm text-[#71717A] font-normal">
            Delete and Deactivate your account
          </p>
          <p className="text-sm text-[#71717A] font-normal">
            Deleting this organization will remove all teams, members and data
            from this organization. You <br /> will not be able to recover this
            data.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex w-28 space-x-2 items-center justify-center bg-[#EF4444] hover:bg-red-400 text-white py-2 px-3 rounded-md"
          >
            <Image src={trash} alt="trash"></Image>
            <p>Delete</p>
          </button>
        </div>
      </If>
      <If condition={currentUserRole === MembershipRole.Admin}>
        <div className="border rounded-md h-[384] overflow-y-auto p-6 space-y-6">
          <div className="md:flex justify-between items-center space-y-2 md:space-y-0">
            <div>
              <p className="text-2xl font-semibold">Admins ({totalAdmins})</p>
              <If condition={currentUserRole === MembershipRole.Admin}>
                <p className="text-sm text-[#71717A]">
                  Add users to your organization admin - you can only add up to
                  5 admins
                </p>
              </If>
            </div>
            <If
              condition={
                currentUserRole === MembershipRole.Admin &&
                totalAdmins < rules?.maxAdmins
              }
            >
              <button
                onClick={showAdminModalHandler}
                className="bg-black  py-2 px-4 rounded-md flex items-center space-x-2 text-white hover:bg-gray-800"
              >
                <Image src={plus} alt="plus" />
                <p>Add Admins</p>
              </button>
            </If>
          </div>
          <OrganizationMembersList
            organizationId={organizationId}
            setTotalMembers={setTotalAdmins}
            isAdminTable={true}
          />
          <OrganizationInvitedMembersList
            organizationId={organizationId}
            teamId={teamId}
            facilitator={facilitator}
            setTotalPendingInvites={setTotalPendingInvites}
            type={'admins'}
          />
        </div>
      </If>
    </div>
  );
};

/**
 * @description Upload file to Storage
 * @param storage
 * @param organizationId
 * @param logo
 */
async function uploadLogo({
  storage,
  organizationId,
  logo,
}: {
  storage: FirebaseStorage;
  organizationId: string;
  logo: File;
}) {
  const path = getLogoStoragePath(organizationId, logo.name);
  const bytes = await logo.arrayBuffer();
  const fileRef = ref(storage, path);

  // first, we upload the logo to Firebase Storage
  await uploadBytes(fileRef, bytes, {
    contentType: logo.type,
  });

  // now we can get the download URL from its reference
  return await getDownloadURL(fileRef);
}

/**
 *
 * @param organizationId
 * @param fileName
 */
function getLogoStoragePath(organizationId: string, fileName: string) {
  return [`/organizations`, organizationId, fileName].join('/');
}

function getLogoFile(value: string | null | FileList) {
  if (!value || typeof value === 'string') {
    return;
  }

  return value.item(0) ?? undefined;
}

export default UpdateOrganizationForm;
