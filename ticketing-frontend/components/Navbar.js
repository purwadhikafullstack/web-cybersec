'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  function closeDrawer() {
    setDrawerOpen(false);
  }

  return (
    <>
      <div className="utility">
        <div className="container">
          <span className="promo">
            <span className="tag">LAB</span>
            Deliberately vulnerable app — for authorized security training only
          </span>
        </div>
      </div>

      <header className="site-header">
        <div className="container">
          <Link href="/" className="brand">
            <span className="brand-mark">E</span>
            Eventra
          </Link>

          <div className="icon-row">
            {user ? (
              <>
                <span className="user-chip">
                  <strong>{user.email}</strong>
                  <span className="role-pill">{user.role}</span>
                </span>
                <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn--ghost btn--sm">Login</Link>
                <Link href="/register" className="btn btn--indigo btn--sm">Daftar</Link>
              </>
            )}
            <button
              type="button"
              className="nav-toggle"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              ≡
            </button>
          </div>
        </div>
      </header>

      <nav className="nav-bar" aria-label="Primary">
        <div className="container">
          <div className="main-nav">
            <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>Event</Link>
            {user && <Link href="/tickets" aria-current={pathname === '/tickets' ? 'page' : undefined}>Tiket Saya</Link>}
            {user?.role === 'admin' && <Link href="/admin" aria-current={pathname === '/admin' ? 'page' : undefined}>Admin</Link>}
          </div>
          <span className="nav-cta">TRAINING <strong>ENVIRONMENT</strong></span>
        </div>
      </nav>

      <div className={`drawer${drawerOpen ? ' is-open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="drawer-head">
          <span className="brand"><span className="brand-mark">E</span> Eventra</span>
          <button type="button" className="drawer-close" onClick={closeDrawer}>Close ✕</button>
        </div>
        <Link href="/" onClick={closeDrawer}>Event</Link>
        {user && <Link href="/tickets" onClick={closeDrawer}>Tiket Saya</Link>}
        {user?.role === 'admin' && <Link href="/admin" onClick={closeDrawer}>Admin</Link>}
        {!user && <Link href="/login" onClick={closeDrawer}>Login</Link>}
        {!user && <Link href="/register" onClick={closeDrawer}>Daftar</Link>}
        {user && (
          <button type="button" className="drawer-link" onClick={() => { closeDrawer(); logout(); }}>
            Logout
          </button>
        )}
      </div>
    </>
  );
}
