import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';

export const metadata = {
  title: 'Chat',
  description: 'Realtime chat test project',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="h-full bg-gray-50 text-gray-900">
        <AuthProvider>
          <SocketProvider>{children}</SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
