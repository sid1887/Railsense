import type { Metadata } from 'next';
import './globals.css';
import ToastContainer from '@/components/ToastContainer';

export const metadata: Metadata = {
  title: 'RailSense - Intelligent Train Halt Insight System',
  description: 'Real-time train tracking and intelligent halt analysis for passenger clarity',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="bg-dark-bg text-text-primary antialiased">
        <main className="min-h-screen">
          {children}
        </main>
        <ToastContainer />
      </body>
    </html>
  );
}
