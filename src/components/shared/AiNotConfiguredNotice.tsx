import Link from 'next/link';

import If from '~/core/ui/If';
import useAiStatus from '~/lib/ai/hooks/use-ai-status';

/**
 * @name AiNotConfiguredNotice
 * @description Shown above AI features when no provider key is set.
 *
 * This build has no paid tier and no hosted AI key — every AI feature is
 * available to everyone as soon as the self-hoster supplies their own key. So
 * this is a setup hint, never an upgrade prompt.
 */
const AiNotConfiguredNotice: React.FC<{ className?: string }> = ({
  className,
}) => {
  const { configured, message } = useAiStatus();

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

        <p className={'mt-2'}>
          <Link href={'/admin/ai'} className={'underline'}>
            Open AI Settings
          </Link>{' '}
          to paste a key from Anthropic, OpenAI or Google — or point the app at
          any OpenAI-compatible endpoint you run yourself.
        </p>
      </div>
    </If>
  );
};

export default AiNotConfiguredNotice;
