import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Event Ticketing (Dummy)',
  description: 'Deliberately vulnerable event ticketing app for pentest training.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
