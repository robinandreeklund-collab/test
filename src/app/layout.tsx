import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'GiGi — your household chief of staff',
  description:
    'GiGi is a proactive chief of staff for the household. One 7am digest, four things that matter, one-tap approvals.',
};

export const viewport: Viewport = {
  themeColor: '#faf6f0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="viewport">
          <div className="phone">{children}</div>
        </div>
      </body>
    </html>
  );
}
