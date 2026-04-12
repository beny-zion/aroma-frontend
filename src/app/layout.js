import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import LayoutShell from '@/components/LayoutShell';

export const metadata = {
  title: 'ארומה פלוס - מערכת ניהול',
  description: 'מערכת ניהול מכשירי ריח ומילויים',
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-gray-50 min-h-screen">
        <AuthProvider>
          <LayoutShell>
            {children}
          </LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
