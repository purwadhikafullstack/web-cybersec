'use client';

import Link from 'next/link';
import { useAuth } from '../lib/auth-context';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav
      style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #ddd',
      }}
    >
      <Link href="/">Events</Link>
      {user && <Link href="/tickets">My Tickets</Link>}
      {user?.role === 'admin' && <Link href="/admin">Admin</Link>}
      <span style={{ marginLeft: 'auto' }} />
      {user ? (
        <>
          <span>
            {user.email} ({user.role})
          </span>
          <button type="button" onClick={logout}>
            Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </>
      )}
    </nav>
  );
}
