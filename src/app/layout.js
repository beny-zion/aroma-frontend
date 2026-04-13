import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import LayoutShell from '@/components/LayoutShell';
import PWARegister from '@/components/PWARegister';

export const metadata = {
  title: 'ארומה פלוס - מערכת ניהול',
  description: 'מערכת ניהול מכשירי ריח ומילויים',
  manifest: '/manifest.json',
  themeColor: '#6B8E7B',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ארומה פלוס',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-gray-50 min-h-screen">
        <PWARegister />
        <AuthProvider>
          <LayoutShell>
            {children}
          </LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
