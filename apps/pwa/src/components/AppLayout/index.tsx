import { Footer } from './Footer';
import { Header } from './Header';
import { PushRegistrar } from './PushRegistrar';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <PushRegistrar />
      <Header />
      {children}
      <Footer />
    </div>
  );
};
