'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { challenges } from '../../lib/api';

const typeLabels = {
  grand_prix: 'Grand Prix',
  desafio_integradores: 'Desafio Integradores',
  inova_senai: 'Inova SENAI',
};

const statusClass = {
  draft: 'badge-draft',
  open: 'badge-open',
  submission: 'badge-open',
  evaluation: 'badge-open',
  closed: 'badge-closed',
};

export default function DesafiosPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    challenges.list(filter || undefined).then(setList).catch(() => setList([])).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="container">
      <h1>Desafios</h1>
      <div style={{ marginBottom: '1rem' }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '0.5rem' }}>
          <option value="">Todos os status</option>
          <option value="open">Abertos</option>
          <option value="submission">Inscrições</option>
          <option value="evaluation">Avaliação</option>
          <option value="closed">Encerrados</option>
        </select>
      </div>
      {loading && <p>Carregando...</p>}
      {!loading && list.length === 0 && <p>Nenhum desafio encontrado.</p>}
      <div className="grid grid-2">
        {list.map((c) => (
          <div key={c.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>{c.title}</h3>
              <span className={`badge ${statusClass[c.status] || 'badge-draft'}`}>{c.status}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {typeLabels[c.type] || c.type} {c.region_name && ` • ${c.region_name}`}
            </p>
            <p style={{ margin: '0.5rem 0' }}>{c.description?.slice(0, 120)}...</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Equipes: {c.teams_count ?? 0} • Projetos: {c.projects_count ?? 0}
            </p>
            <Link href={`/desafios/${c.id}`} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Ver detalhes
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
