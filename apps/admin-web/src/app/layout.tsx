import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tuite Admin',
  description: 'Tuite Tuition Management — Admin Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
