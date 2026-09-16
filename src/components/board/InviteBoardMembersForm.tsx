import { Trans, useTranslation } from 'next-i18next';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import toast, { type Toast } from 'react-hot-toast';
import toaster from 'react-hot-toast';

import PlusCircleIcon from 'public/assets/svg/copy-plus.svg';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';

import { MembershipRole } from '~/lib/organizations/types/membership-role';

import TextField from '~/core/ui/TextField';
import Button from '~/core/ui/Button';
import IconButton from '~/core/ui/IconButton';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/core/ui/Tooltip';

import { useUserSession } from '~/core/hooks/use-user-session';

import Image from 'next/image';
import send from '/public/assets/svg/send.svg';
import BoardMembershipRoleSelector from '../board/BoardMembershipRoleSelector';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { useCurrentSubscriptionById } from '~/lib/entitlements/hooks/use-entitlements';
import { useFetchAcceptedInvitedMembers } from '~/lib/organizations/hooks/use-fetch-accepted-invites';

type InviteModel = ReturnType<typeof memberFactory>;

interface Props {
  trigger: Function;
  submitAction: Function;
  body: any;
  isDemo?: boolean;
}

const InviteBoardForm = ({
  trigger,
  submitAction,
  body,
  isDemo = false,
}: Props) => {
  const { t } = useTranslation('organization');

  const organization = useCurrentOrganization();

  const { totalInvitations } = useFetchAcceptedInvitedMembers(
    organization?.id as string,
  );

  const [organizationInvites, setOrganizationInvites] = useState(0);

  useEffect(() => {
    if (totalInvitations) {
      setOrganizationInvites(totalInvitations);
    }
  }, [totalInvitations]);

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

        if (body) {
          body.members = members;
        } else {
          body = members;
        }
        const promise = trigger(body);

        await toast.promise(promise, {
          success: t(`inviteMembersSuccess`),
          error: t(`inviteMembersError`),
          loading: t(`inviteMembersLoading`),
        });
        submitAction();

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
      organization,
      organizationInvites,
      user,
    ],
  );

  return (
    <>
      <form
        data-cy={'invite-members-form'}
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
      >
        <div className="flex w-full justify-between mb-6">
          <p className="w-full font-medium text-sm">Invite</p>
        </div>

        <div
          className={'max-h-[250px] overflow-y-auto flex flex-col space-y-8'}
        >
          <div className="flex flex-col space-y-8  p-1">
            {controlledFields.map((field, index) => {
              const emailInputName = `members.${index}.email` as const;
              const roleInputName = `members.${index}.role` as const;

              // register email control
              const emailControl = register(emailInputName, {
                required: true,
                validate: (value) => {
                  const invalid = getFormValidator(watchFieldArray)(
                    value,
                    index,
                  );

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
                  <div className={'flex items-center space-x-2 md:space-x-2'}>
                    <div className={'md:w-7/12'}>
                      <TextField.Input
                        {...emailControl}
                        data-cy={'invite-email-input'}
                        placeholder="member@email.com"
                        type="email"
                        required
                      />
                    </div>

                    <div className={'md:w-4/12 w-full'}>
                      <BoardMembershipRoleSelector
                        disabled={isDemo}
                        value={field.role}
                        onChange={(role) => {
                          setValue(roleInputName, role);
                        }}
                      />
                    </div>

                    <div className={'w-[60px] flex justify-end'}>
                      <Tooltip
                        className={
                          'flex justify-center bg-[#F4F4F5] rounded-md'
                        }
                      >
                        <TooltipTrigger asChild>
                          <IconButton
                            type={'button'}
                            disabled={isDemo ? isDemo : fields.length <= 1}
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
                </Fragment>
              );
            })}
          </div>

          <div></div>
        </div>

        <div className="md:flex space-y-2 md:space-y-0 justify-between mt-8">
          <button
            data-cy={'append-new-invite-button w-full '}
            type={'button'}
            className={'bg-gray-200 rounded-md py-2 px-4'}
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
          <Button
            className={'w-40'}
            data-cy={'send-invites-button'}
            type={'submit'}
            color="primary"
            disabled={isDemo}
          >
            <span className={'flex space-x-2 text-sm items-center'}>
              <Image src={send} alt="send" />

              <span>
                <Trans i18nKey={'organization:inviteMembersSubmitLabel'} />
              </span>
            </span>
          </Button>
        </div>
      </form>
    </>
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

export default InviteBoardForm;
