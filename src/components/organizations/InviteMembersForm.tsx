import { useRouter } from 'next/router';
import { Trans, useTranslation } from 'next-i18next';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import PlusCircleIcon from 'public/assets/svg/copy-plus.svg';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';

import { MembershipRole } from '~/lib/organizations/types/membership-role';
import { useInviteMembers } from '~/lib/organizations/hooks/use-invite-members';

import If from '~/core/ui/If';
import TextField from '~/core/ui/TextField';
import Button from '~/core/ui/Button';
import IconButton from '~/core/ui/IconButton';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/core/ui/Tooltip';

import MembershipRoleSelector from './MembershipRoleSelector';
import { useUserSession } from '~/core/hooks/use-user-session';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import Image from 'next/image';
import send from '/public/assets/svg/send.svg';

import { useCurrentTeam } from '~/lib/organizations/hooks/use-current-team';
import { useGetOrganizationById } from '~/lib/organizations/hooks/use-get-organization-by-id';
type InviteModel = ReturnType<typeof memberFactory>;

const InviteMembersForm = ({
  limit,
  onlyAdmins = false,
  setShowAdminModal,
}: {
  limit: number;
  onlyAdmins?: boolean;
  setShowAdminModal?: (show: boolean) => void;
}) => {
  const { t } = useTranslation('organization');
  const router = useRouter();

  const user = useUserSession();
  const facilitator = user?.data?.name + ' ' + user?.data?.lastName;

  const organizationData = useCurrentOrganization();
  const organizationId = organizationData?.id ?? '';

  const { organization } =
    useGetOrganizationById(organizationId);

  const organizationInvites = (Object.keys(organization?.members ?? {}).length -
    1) as number;

  const { team } = useCurrentTeam();
  const teamId = team?.id as string;

  const { trigger, isMutating } = useInviteMembers(organizationId, teamId);

  const { register, handleSubmit, setValue, control, clearErrors, watch } =
    useInviteMembersForm();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members',
    shouldUnregister: true,
  });

  const watchFieldArray = watch('members');

  const controlledFields = fields.map((field, index) => ({
    ...field,
    ...watchFieldArray[index],
  }));

  const navigateToMembersPage = useCallback(() => {
    void router.push(`/settings/organization/members`);
  }, [router]);

  const onSubmit = useCallback(
    async ({ members }: { members: InviteModel[] }) => {
      if (user?.auth?.isAnonymous) {
        toast.error(
          'You are an anonymous user. Please sign up with an email to invite members',
        );
        return;
      }

      members.forEach((member: any) => {
        member.facilitator = facilitator;
        if (onlyAdmins) {
          member.role = MembershipRole.Admin;
          member.type = 'organization';
        }
      });

      try {
        const promise = trigger(members);

        await toast.promise(promise, {
          success: t('inviteMembersSuccess'),
          error: t('inviteMembersError'),
          loading: t('inviteMembersLoading'),
        });

        if (onlyAdmins && setShowAdminModal) {
          setShowAdminModal(false);
        } else {
          navigateToMembersPage();
        }
      } catch (error) {
        console.error('Error inviting members:', error);
      }
    },
    [
      user,
      facilitator,
      onlyAdmins,
      organization,
      organizationInvites,
      trigger,
      t,
      navigateToMembersPage,
      setShowAdminModal,
    ],
  );

  return (
    <form
      className={'flex flex-col space-y-8'}
      data-cy={'invite-members-form'}
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event);
      }}
    >
      <div className="flex flex-col space-y-8">
        {controlledFields.map((field, index) => {
          const emailInputName = `members.${index}.email` as const;
          const roleInputName = `members.${index}.role` as const;

          const emailControl = register(emailInputName, {
            required: true,
            validate: (value) => {
              const invalid = getFormValidator(watchFieldArray)(value, index);

              if (invalid) {
                return t(`duplicateInviteEmailError`);
              }

              const isSameAsCurrentUserEmail = user?.auth?.email === value;

              if (isSameAsCurrentUserEmail) {
                return t(`invitingOwnAccountError`);
              }

              return true;
            },
          });

          register(roleInputName, {
            value: field.role,
          });

          return (
            <Fragment key={field.id}>
              <div className={'md:flex items-center space-x-0.5 md:space-x-2'}>
                <div className={'md:w-7/12'}>
                  <TextField.Input
                    {...emailControl}
                    data-cy={'invite-email-input'}
                    placeholder="member@email.com"
                    type="email"
                    required
                  />
                </div>

                <div className="flex md:w-4/12">
                  <MembershipRoleSelector
                    disabled={onlyAdmins}
                    value={onlyAdmins ? MembershipRole.Admin : field.role}
                    onChange={(role) => {
                      setValue(roleInputName, role);
                    }}
                  />

                  <div className={'w-[60px] flex justify-end'}>
                    <Tooltip
                      className={'flex justify-center bg-[#F4F4F5] rounded-md'}
                    >
                      <TooltipTrigger asChild>
                        <IconButton
                          type={'button'}
                          disabled={fields.length <= 1}
                          data-cy={'remove-invite-button'}
                          label={t('removeInviteButtonLabel')}
                          onClick={() => {
                            remove(index);
                            clearErrors(emailInputName);
                          }}
                        >
                          <XMarkIcon className={'h-4 lg:h-5'} />
                        </IconButton>
                      </TooltipTrigger>

                      <TooltipContent>
                        {t('removeInviteButtonLabel')}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </Fragment>
          );
        })}

        <div>
          <button
            data-cy={'append-new-invite-button'}
            type={'button'}
            className={'mt-8 bg-[#F4F4F5] rounded-md py-2 px-4'}
            onClick={() => {
              if (limit && fields.length < limit) {
                append(memberFactory());
              } else {
                toast.error(
                  `You've reached the invite limit of ${limit} members.`,
                );
              }
            }}
            disabled={limit ? fields.length >= limit : false}
          >
            <span className={'flex items-center space-x-2'}>
              <Image
                src={PlusCircleIcon}
                alt="PlusCircleIcon"
                className={'h-4'}
              />
              <span>
                <Trans i18nKey={'organization:addAnotherMemberButtonLabel'} />
              </span>
            </span>
          </button>
        </div>
      </div>

      <div>
        <Button
          className={'w-full lg:w-auto'}
          data-cy={'send-invites-button'}
          type={'submit'}
          loading={isMutating}
          color="primary"
        >
          <span className={'flex space-x-2 items-center'}>
            <Image src={send} alt="send" />

            <span>
              <If condition={!isMutating}>
                <Trans i18nKey={'organization:inviteMembersSubmitLabel'} />
              </If>

              <If condition={isMutating}>
                <Trans i18nKey={'organization:inviteMembersLoading'} />
              </If>
            </span>
          </span>
        </Button>
      </div>
    </form>
  );
};

function memberFactory() {
  return {
    email: '',
    role: MembershipRole.Member,
    facilitator: '',
  };
}

function getFormValidator(members: InviteModel[]) {
  return function isValueInvalid(value: string, index: number) {
    const emails = members.map((member) => member.email);
    const valueIndex = emails.indexOf(value);

    return valueIndex >= 0 && valueIndex !== index;
  };
}

function useInviteMembersForm() {
  return useForm({
    defaultValues: {
      members: [memberFactory()],
    },
    shouldUseNativeValidation: true,
    shouldFocusError: true,
    shouldUnregister: true,
  });
}

export default InviteMembersForm;
