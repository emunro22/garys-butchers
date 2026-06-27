import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/shop/cart-drawer';
import { CustomerSessionProvider } from '@/components/account/session-provider';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerSessionProvider>
      <AnnouncementBar />
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <CartDrawer />
    </CustomerSessionProvider>
  );
}
