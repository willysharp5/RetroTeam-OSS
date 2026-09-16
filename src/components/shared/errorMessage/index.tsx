import { Trans } from 'next-i18next';
import Alert from '~/core/ui/Alert';

/**
 * @name ErrorMessage
 * @param error
 * This error is mapped from the translation auth:errors.{error}
 * To update the error messages, please update the translation file
 * @constructor
 */
export default function ErrorMessage({
  title,
  error,
}: {
  error: Maybe<string>;
  title: Maybe<string>;
}) {
  if (!error) {
    return null;
  }

  return (
    <Alert className={'w-full'} type={'error'}>
      <Alert.Heading>
        <Trans i18nKey={title} />
      </Alert.Heading>

      <p data-cy={'auth-error-message'}>{error}</p>
    </Alert>
  );
}
