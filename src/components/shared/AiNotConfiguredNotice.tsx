import Link from 'next/link';

import If from '~/core/ui/If';
import useAiStatus from '~/lib/ai/hooks/use-ai-status';
import { useUserSession } from '~/core/hooks/use-user-session';

/**
 * @name AiNotConfiguredNotice
 * @description Shown above AI features when no provider key is set.
 *
 * This build has no paid tier and no hosted AI key — every AI feature is
 * available to everyone as soon as the self-hoster supplies their own key. So
 * this is a setup hint, never an upgrade prompt.
 *
 * Admin → AI Settings is gated on `superAdmin`, which is not the same thing as
 * being an admin of an organization. Sending an org admin to a page that will
 * bounce them is worse than not offering the link, so the instruction depends on
 * who is reading it.
 */
const AiNotConfiguredNotice: React.FC<{ className?: string }> = ({
  className,
}) => {
  const { configured, message } = useAiStatus();
  const isSuperAdmin = useUserSession()?.data?.superAdmin === true;

  return (
    <If condition={!configured}>
      <div
        className={`rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${
          className ?? ''
        }`}
        role={'status'}
      >
        <p className={'font-medium'}>AI features need an API key</p>

        <p className={'mt-1'}>
          {message ??
            'No AI API key is configured. Add your own API key to enable AI features.'}
        </p>

        <If condition={isSuperAdmin}>
          <p className={'mt-2'}>
            <Link href={'/admin/ai'} className={'underline'}>
              Open AI Settings
            </Link>{' '}
            to paste a key from Anthropic, OpenAI or Google — or point the app
            at any OpenAI-compatible endpoint you run yourself.
          </p>
        </If>

        <If condition={!isSuperAdmin}>
          <p className={'mt-2'}>
            You do not have access to AI Settings, so there is nothing to do
            here. Ask whoever runs this install to add a key — they can set{' '}
            <code className={'rounded bg-amber-100 px-1'}>AI_API_KEY</code> in
            the environment, or paste one in Admin → AI Settings. Everything
            else on this board works as normal.
          </p>
        </If>
      </div>
    </If>
  );
};

export default AiNotConfiguredNotice;
