'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dashboard, learning } from '../../lib/api';

export default function MinhaJornadaPage() {
  const [data, setData] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboard.me(), learning.myProgress().catch(() => [])]).then(([me, prog]) => {
      setData(me);
      setProgress(Array.isArray(prog) ? prog : []);
    }).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container"><p>Carregando...</p></div>;
  if (!data) return <div className="container"><p>Faça login para ver sua jornada.</p></div>;

  return (
    <div className="container">
      <h1>Minha Jornada</h1>
      <p>Suas equipes e projetos nos desafios.</p>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Equipes e projetos</h2>
        {!data.teams?.length && <p style={{ color: 'var(--text-muted)' }}>Você ainda não está em nenhuma equipe.</p>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {(data.teams || []).map((t) => (
            <li key={t.team_id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--senai-border)' }}>
              <strong>{t.team_name}</strong> — {t.challenge_title} ({t.challenge_type})
              {t.project_id && (
                <> • Projeto: <Link href={`/projetos/${t.project_id}`}>{t.project_title}</Link> — {t.project_status}</>
              )}
            </li>
          ))}
        </ul>
      </div>
      {progress.length > 0 && (
        <div className="card">
          <h2>Progresso no aprendizado</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {progress.map((p) => (
              <li key={p.id} style={{ padding: '0.5rem 0' }}>
                {p.title} — concluído
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
