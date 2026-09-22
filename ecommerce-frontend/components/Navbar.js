'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { getCart } from '../lib/cart';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const items = getCart();
    setCartCount(items.reduce((sum, i) => sum + i.quantity, 0));
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
            <span className="brand-mark">D</span>
            Dumverse
          </Link>

          <div className="icon-row">
            {user && (
              <Link href="/cart" className="icon-btn icon-btn--cart" aria-label="Cart">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2l-2 5v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-2-5z"/><path d="M4 7h16"/><path d="M16 11a4 4 0 0 1-8 0"/></svg>
                Cart
                {cartCount > 0 && <span className="count">{cartCount}</span>}
              </Link>
            )}
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
            <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>Katalog</Link>
            {user && <Link href="/orders" aria-current={pathname === '/orders' ? 'page' : undefined}>Pesanan Saya</Link>}
            {user && <Link href="/profile" aria-current={pathname === '/profile' ? 'page' : undefined}>Profil</Link>}
            {user?.role === 'admin' && <Link href="/admin" aria-current={pathname === '/admin' ? 'page' : undefined}>Admin</Link>}
          </div>
          <span className="nav-cta">TRAINING <strong>ENVIRONMENT</strong></span>
        </div>
      </nav>

      <div className={`drawer${drawerOpen ? ' is-open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="drawer-head">
          <span className="brand"><span className="brand-mark">D</span> Dumverse</span>
          <button type="button" className="drawer-close" onClick={closeDrawer}>Close ✕</button>
        </div>
        <Link href="/" onClick={closeDrawer}>Katalog</Link>
        {user && <Link href="/cart" onClick={closeDrawer}>Cart{cartCount > 0 ? ` (${cartCount})` : ''}</Link>}
        {user && <Link href="/orders" onClick={closeDrawer}>Pesanan Saya</Link>}
        {user && <Link href="/profile" onClick={closeDrawer}>Profil</Link>}
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
