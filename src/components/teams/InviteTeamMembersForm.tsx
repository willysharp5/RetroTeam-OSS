import { Trans, useTranslation } from 'next-i18next';
import { Fragment, useCallback, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import PlusCircleIcon from 'public/assets/svg/copy-plus.svg';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';

import { MembershipRole } from '~/lib/organizations/types/membership-role';

import If from '~/core/ui/If';
import TextField from '~/core/ui/TextField';
import Button from '~/core/ui/Button';
import IconButton from '~/core/ui/IconButton';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/core/ui/Tooltip';

import MembershipRoleSelector from '../organizations/MembershipRoleSelector';
import { useUserSession } from '~/core/hooks/use-user-session';

import Image from 'next/image';
import send from '/public/assets/svg/send.svg';
import BoardMembershipRoleSelector from '../board/BoardMembershipRoleSelector';

type InviteModel = ReturnType<typeof memberFactory>;

interface Props {
  type: string;
  trigger: Function;
  isMutating: boolean;
  submitAction: Function;
  organizationInvites: number;
}

const InviteForm = ({
  type,
  trigger,
  isMutating,
  submitAction,
  organizationInvites,
}: Props) => {
  const { t } = useTranslation('organization');

  const user = useUserSession();
  const facilitator = user?.data?.name + ' ' + user?.data?.lastName;

  const { register, handleSubmit, setValue, control, clearErrors, watch } =
    useInviteMembersForm();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members',
    shouldUnregister: true,
  });

  const watchFieldArray = watch('members');

  const controlledFields = fields.map((field, index) => {
    return {
      ...field,
      ...watchFieldArray[index],
    };
  });

  const onSubmit = useCallback(
    async ({ members }: { members: InviteModel[] }) => {
      if (!user?.auth?.isAnonymous) {
        members.forEach((member) => {
          member.facilitator = facilitator;
        });
        
        const body = members;

        const promise = trigger(body);

        await toast.promise(promise, {
          success: t(`inviteMembersSuccess`),
          error: t(`inviteMembersError`),
          loading: t(`inviteMembersLoading`),
        });

        submitAction();

        // Mantener solo un miembro vacío después del envío
        const emptyMember = memberFactory();
        setValue('members', [emptyMember]);
      } else {
        toast.error(
          'You are an anonymous user. Please sign up with an email to invite members',
        );
      }
    },
    [
      submitAction,
      trigger,
      t,
      user,
      facilitator,
      organizationInvites,
      setValue,
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

          // register email control
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

          // register role control
          register(roleInputName, {
            value: field.role,
          });

          return (
            <Fragment key={field.id}>
              <div
                className={
                  'md:flex items-center space-x-0 space-y-2 md:space-y-0 md:space-x-2'
                }
              >
                <div className={'md:w-7/12'}>
                  <TextField.Input
                    {...emailControl}
                    data-cy={'invite-email-input'}
                    placeholder="member@email.com"
                    type="email"
                    required
                  />
                </div>
                <div className="flex md:w-4/12 w-full">
                  <div className={''}>
                    {type !== 'admin-member' && (
                      <BoardMembershipRoleSelector
                        disabled={false}
                        value={field.role}
                        onChange={(role) => {
                          setValue(roleInputName, role);
                        }}
                      />
                    )}
                  </div>

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
              if (fields.length < 10) {
                append(memberFactory());
              } else {
                toast.error('Maximum limit of 10 members reached.');
              }
            }}
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

export default InviteForm;
