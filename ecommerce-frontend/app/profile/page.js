'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { apiFetch } from '../../lib/api';

// Note: this form intentionally has no "role" field — role is not meant to
// be user-editable. The backend, however, accepts it anyway (vuln #4);
// that's only reachable by calling the API directly, not through this UI.
export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAddress(user.address || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    const res = await apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ name, address, phone }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('Profil diperbarui.');
      refreshUser();
    } else {
      setMessage(data.error || 'Gagal memperbarui profil');
    }
  }

  if (loading) return <p className="loading-state">Loading...</p>;
  if (!user) return <p className="loading-state">Silakan login.</p>;

  return (
    <div className="form-card">
      <h1>Profil</h1>
      <p className="sub">Email: {user.email} (tidak bisa diubah)</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Nama</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama" />
        </div>
        <div className="field">
          <label>Alamat</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat" />
        </div>
        <div className="field">
          <label>Telepon</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telepon" />
        </div>
        <button type="submit" className="btn btn--indigo btn--block">Simpan</button>
      </form>
      {message && <p className="alert alert--info">{message}</p>}
    </div>
  );
}
