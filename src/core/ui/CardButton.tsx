import { forwardRef } from 'react';
import Button from '~/core/ui/Button';

const CardButton = forwardRef<
  typeof Button,
  React.ComponentProps<typeof Button>
>(function CardButtonComponent(props, _) {
  return (
    <Button
      {...props}
      size={'large'}
      color={'custom'}
      className={
        'h-28 rounded-sm shadow' +
        ' cursor-pointer transition-all hover:shadow-lg' +
        ' ring-primary-500 active:bg-gray-50'
      }
    >
      {props.children}
    </Button>
  );
});

export default CardButton;
