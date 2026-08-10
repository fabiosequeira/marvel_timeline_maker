import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Media Timeline',
  description: 'A custom watch-order timeline for movies and TV shows.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-base-950 text-base-100 font-sans antialiased min-h-screen">{children}</body>
    </html>
  );
}
