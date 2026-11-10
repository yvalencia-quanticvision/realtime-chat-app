import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

export const metadata = {
  title: 'Chat',
  description: 'Aplicacion de chat en tiempo real',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={sans.variable}>
      <body className="h-full bg-stone-100 text-stone-900">
        <AuthProvider>
          <SocketProvider>{children}</SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
