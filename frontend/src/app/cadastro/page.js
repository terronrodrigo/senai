'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, regions } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [regionsList, setRegionsList] = useState([]);
  const [form, setForm] = useState({
    email: '', password: '', name: '', role: 'aluno', region_id: '', phone: '', lgpd_consent: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    regions.list().then(setRegionsList).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await auth.register({
        ...form,
        region_id: form.region_id || undefined,
        phone: form.phone || undefined,
      });
      localStorage.setItem('saga_token', token);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480, margin: '2rem auto' }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Cadastro</h1>
        {error && <p style={{ color: '#dc3545', marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Senha (mín. 8 caracteres)</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </div>
          <div className="form-group">
            <label>Papel</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="aluno">Aluno</option>
              <option value="docente">Docente</option>
              <option value="egresso">Egresso</option>
              <option value="tecnico">Técnico</option>
              <option value="consultor">Consultor</option>
              <option value="admin_dr">Admin DR</option>
              <option value="admin_dn">Admin DN</option>
              <option value="empresa">Empresa</option>
            </select>
          </div>
          <div className="form-group">
            <label>Região (DR)</label>
            <select value={form.region_id} onChange={(e) => setForm({ ...form, region_id: e.target.value })}>
              <option value="">—</option>
              {regionsList.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Telefone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={form.lgpd_consent} onChange={(e) => setForm({ ...form, lgpd_consent: e.target.checked })} />
              Concordo com o uso dos meus dados (LGPD)
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        <p style={{ marginTop: '1rem' }}>
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
