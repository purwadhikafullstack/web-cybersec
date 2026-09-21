'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      router.push('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Daftar Akun</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 320 }}>
        <input placeholder="Nama" value={form.name} onChange={update('name')} required />
        <input type="email" placeholder="Email" value={form.email} onChange={update('email')} required />
        <input type="password" placeholder="Password" value={form.password} onChange={update('password')} required />
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button type="submit">Daftar</button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        Sudah punya akun? <Link href="/login">Login</Link>
      </p>
    </div>
  );
}
