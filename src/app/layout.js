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
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'ארומה פלוס - מערכת ניהול',
    description: 'מערכת ניהול מכשירי ריח ומילויים',
    images: [{ url: '/opengraph-image-aromaPlus.png', width: 1200, height: 630 }],
    locale: 'he_IL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ארומה פלוס - מערכת ניהול',
    description: 'מערכת ניהול מכשירי ריח ומילויים',
    images: ['/opengraph-image-aromaPlus.png'],
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
