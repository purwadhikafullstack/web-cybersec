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
    <div className="form-card">
      <h1>Daftar Akun</h1>
      <p className="sub">Buat akun baru untuk mulai memesan tiket di Eventra.</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Nama</label>
          <input placeholder="Nama" value={form.name} onChange={update('name')} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" placeholder="Email" value={form.email} onChange={update('email')} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" placeholder="Password" value={form.password} onChange={update('password')} required />
        </div>
        {error && <p className="alert alert--error">{error}</p>}
        <button type="submit" className="btn btn--indigo btn--block">Daftar</button>
      </form>
      <p className="form-foot">
        Sudah punya akun? <Link href="/login">Login</Link>
      </p>
    </div>
  );
}
