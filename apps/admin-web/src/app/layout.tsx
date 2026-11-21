import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Tuite Admin',
  description: 'Tuite Tuition Management — Admin Dashboard',
};

// Runs before first paint: applies cached tenant brand colors to avoid a default-theme flash.
const THEME_BOOTSTRAP = `try{var t=JSON.parse(localStorage.getItem('tuite_tenant_profile')||'null');if(t){var r=document.documentElement.style;if(t.primaryColor)r.setProperty('--tuite-color-primary',t.primaryColor);if(t.secondaryColor)r.setProperty('--tuite-color-secondary',t.secondaryColor);}}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
