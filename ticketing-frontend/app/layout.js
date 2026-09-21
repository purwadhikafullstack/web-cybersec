import './globals.css';

export const metadata = {
  title: 'Event Ticketing (Dummy)',
  description: 'Deliberately vulnerable event ticketing app for pentest training.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
