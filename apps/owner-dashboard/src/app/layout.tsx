import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { TooltipProvider } from '@repo/ui';

import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Casa TimTavio · Intelligence Dashboard',
  description: 'Intelligence dashboard for Casa TimTavio estate owners.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-intel-main antialiased">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
