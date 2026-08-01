import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Playfair_Display } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cormorant',
});

export const metadata: Metadata = {
  title: 'Villa TimTavio | Owner Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}
    >
      <body className="font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
