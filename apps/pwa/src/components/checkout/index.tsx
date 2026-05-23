import { CheckoutFolio } from './CheckoutFolio';
import { CheckoutHeader } from './CheckoutHeader';

export const Checkout = () => {
  return (
    <div className="flex flex-col min-h-[calc(100dvh-104px)]">
      <CheckoutHeader />
      <CheckoutFolio />
    </div>
  );
};
