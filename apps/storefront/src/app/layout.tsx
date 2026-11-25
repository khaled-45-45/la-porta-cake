import type { ReactNode } from 'react';

// Every page lives under app/[locale], whose layout renders <html lang dir>.
// This root layout only exists because app/not-found.tsx needs one.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
