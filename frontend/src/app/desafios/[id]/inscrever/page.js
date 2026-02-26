'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { challenges, teams } from '../../lib/api';

export default function InscreverEquipePage() {
  const params = useParams();
  const router = useRouter();
  const [challenge, setChallenge] = useState(null);
  const [name, setName] = useState('');
  const [memberIds, setMemberIds] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    challenges.get(params.id).then(setChallenge).catch(() => setChallenge(null));
  }, [params.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ids = memberIds.split(/[\s,]+/).filter(Boolean);
      await teams.create(params.id, { name, member_ids: ids });
      router.push(`/desafios/${params.id}`);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Erro ao inscrever');
    } finally {
      setLoading(false);
    }
  }

  if (!challenge) return <div className="container"><p>Carregando...</p></div>;

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <Link href={`/desafios/${params.id}`}>← Voltar ao desafio</Link>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Inscrever equipe — {challenge.title}</h1>
        {error && <p style={{ color: '#dc3545', marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome da equipe</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>IDs dos membros (UUIDs separados por vírgula; você já é o líder)</label>
            <input value={memberIds} onChange={(e) => setMemberIds(e.target.value)} placeholder="opcional" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Enviando...' : 'Inscrever equipe'}
          </button>
        </form>
      </div>
    </div>
  );
}
