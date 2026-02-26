'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { learning } from '../../lib/api';

export default function AprendizadoPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    learning.modules().then(setModules).catch(() => setModules([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <h1>Aprendizado contínuo</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Módulos sobre MSPE, Empreendedorismo, BMC, Pitch, Prototipagem e temas avançados.
      </p>
      {loading && <p>Carregando...</p>}
      {!loading && modules.length === 0 && <p>Nenhum módulo publicado no momento.</p>}
      <div className="grid grid-2">
        {modules.map((m) => (
          <div key={m.id} className="card">
            <h3 style={{ marginTop: 0 }}>{m.title}</h3>
            <p>{m.description}</p>
            <Link href={`/aprendizado/${m.slug}`} className="btn btn-secondary">Acessar</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
