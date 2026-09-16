import Button from '../ui/Button';
import AuthProviderLogo from '~/core/ui/AuthProviderLogo';

const AuthProviderButton: React.FCC<{
  providerId: string;
  onClick: () => unknown;
}> = ({ children, providerId, onClick }) => {
  return (
    <Button
      data-cy={'auth-provider-button'}
      block
      color={'custom'}
      className={`w-full flex text-gray-600 ring-primary-200
      ring-offset-1 transition-all hover:border-gray-300 hover:bg-gray-50
      focus:ring-2 bg-zinc-100 items-center justify-center`}
      onClick={onClick}
      data-provider={providerId}
    >
      <span className={'flex items-center'}>
        <AuthProviderLogo firebaseProviderId={providerId} />
      </span>
      <span className={'ml-2 text-current text-[#18181B]'}>{children}</span>{' '}
      {/* Updated className */}
    </Button>
  );
};

export default AuthProviderButton;
