'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { challenges, teams, projects, evaluations } from '../../lib/api';

const typeLabels = { grand_prix: 'Grand Prix', desafio_integradores: 'Desafio Integradores', inova_senai: 'Inova SENAI' };

export default function DesafioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [challenge, setChallenge] = useState(null);
  const [teamList, setTeamList] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [token, setToken] = useState(false);

  useEffect(() => {
    setToken(!!(typeof window !== 'undefined' && localStorage.getItem('saga_token')));
  }, []);

  useEffect(() => {
    if (!params.id) return;
    challenges.get(params.id).then(setChallenge).catch(() => setChallenge(null));
    teams.list(params.id).then(setTeamList).catch(() => setTeamList([]));
    evaluations.ranking(params.id).then(setRanking).catch(() => setRanking([]));
  }, [params.id]);

  if (!challenge) return <div className="container"><p>Carregando...</p></div>;

  return (
    <div className="container">
      <Link href="/desafios" style={{ marginBottom: '1rem', display: 'inline-block' }}>← Desafios</Link>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{challenge.title}</h1>
        <p><span className="badge badge-open">{challenge.status}</span> {typeLabels[challenge.type]} {challenge.region_name && ` • ${challenge.region_name}`}</p>
        <p>{challenge.description}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Inscrições até {challenge.registration_end ? new Date(challenge.registration_end).toLocaleDateString('pt-BR') : '—'} •
          Submissão até {challenge.submission_end ? new Date(challenge.submission_end).toLocaleDateString('pt-BR') : '—'}
        </p>
        {token && (challenge.status === 'open' || challenge.status === 'submission') && (
          <Link href={`/desafios/${params.id}/inscrever`} className="btn btn-primary">Inscrever equipe</Link>
        )}
      </div>

      <h2>Equipes ({teamList.length})</h2>
      <div className="card">
        {teamList.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Nenhuma equipe inscrita ainda.</p>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {teamList.map((t) => (
            <li key={t.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--senai-border)' }}>
              <strong>{t.name}</strong> — Líder: {t.leader_name || t.leader_email}
            </li>
          ))}
        </ul>
      </div>

      {ranking.length > 0 && (
        <>
          <h2>Ranking</h2>
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--senai-border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Projeto</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Equipe</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Média</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr key={r.project_id} style={{ borderBottom: '1px solid var(--senai-border)' }}>
                    <td style={{ padding: '0.5rem' }}>{r.rank}</td>
                    <td style={{ padding: '0.5rem' }}>{r.title}</td>
                    <td style={{ padding: '0.5rem' }}>{r.team_name}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{r.avg_score != null ? Number(r.avg_score).toFixed(2) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
