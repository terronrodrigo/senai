'use client';

import { useState, useEffect } from 'react';
import { dashboard, regions } from '../../lib/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'top' },
  },
  scales: {
    y: { beginAtZero: true },
  },
};

export default function DashboardPage() {
  const [national, setNational] = useState(null);
  const [regional, setRegional] = useState(null);
  const [regionsList, setRegionsList] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    regions.list().then(setRegionsList).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      dashboard.national().catch((e) => { setError(e.message); return null; }),
      selectedRegion ? dashboard.regional(selectedRegion).catch(() => null) : Promise.resolve(null),
    ]).then(([nat, reg]) => {
      setNational(nat);
      setRegional(reg);
    }).finally(() => setLoading(false));
  }, [selectedRegion]);

  if (loading && !national) return <div className="container"><p>Carregando...</p></div>;
  if (error) return <div className="container"><p style={{ color: '#dc3545' }}>{error} (acesso restrito a admin DN)</p></div>;

  const byRegionData = national?.byRegion?.length
    ? {
        labels: national.byRegion.map((r) => r.region_name),
        datasets: [
          { label: 'Desafios', data: national.byRegion.map((r) => r.challenges), backgroundColor: 'rgba(0,51,102,0.7)' },
          { label: 'Projetos', data: national.byRegion.map((r) => r.projects), backgroundColor: 'rgba(232,93,4,0.7)' },
        ],
      }
    : null;

  return (
    <div className="container">
      <h1>Dashboard (Visão Nacional)</h1>
      {national && (
        <>
          <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
            <div className="card">
              <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Desafios</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.25rem 0' }}>{national.totalChallenges}</p>
            </div>
            <div className="card">
              <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Projetos submetidos</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.25rem 0' }}>{national.totalProjects}</p>
            </div>
            <div className="card">
              <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Equipes</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.25rem 0' }}>{national.totalTeams}</p>
            </div>
          </div>
          {byRegionData && (
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Por região (DR)</h2>
              <Bar data={byRegionData} options={chartOptions} />
            </div>
          )}
          {national.byType?.length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <h3>Por tipo de desafio</h3>
              <ul>
                {national.byType.map((t) => (
                  <li key={t.type}>{t.type}: {t.total}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      {regionsList.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>Visão regional</h3>
          <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
            <option value="">Selecione uma região</option>
            {regionsList.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          {regional?.challenges?.length > 0 && (
            <ul style={{ marginTop: '1rem' }}>
              {regional.challenges.map((c) => (
                <li key={c.id}>{c.title} — {c.teams_count} equipes, {c.projects_count} projetos</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
