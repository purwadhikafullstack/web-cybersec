'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="form-card">
      <h1>Login</h1>
      <p className="sub">Masuk untuk melihat daftar event dan pesan tiket.</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Email</label>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="alert alert--error">{error}</p>}
        <button type="submit" className="btn btn--indigo btn--block">Login</button>
      </form>
      <p className="form-foot">
        Belum punya akun? <Link href="/register">Daftar</Link>
      </p>
    </div>
  );
}
