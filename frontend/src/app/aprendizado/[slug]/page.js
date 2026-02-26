'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { learning } from '../../lib/api';

export default function ModuloPage() {
  const params = useParams();
  const [module, setModule] = useState(null);
  const [token, setToken] = useState(false);

  useEffect(() => {
    setToken(!!(typeof window !== 'undefined' && localStorage.getItem('saga_token')));
  }, []);

  useEffect(() => {
    learning.module(params.slug).then(setModule).catch(() => setModule(null));
  }, [params.slug]);

  async function markComplete() {
    if (!module?.id || !token) return;
    try {
      await learning.complete(module.id);
      alert('Progresso registrado!');
    } catch (e) {
      alert('Erro ao registrar.');
    }
  }

  if (!module) return <div className="container"><p>Carregando...</p></div>;

  const content = module.content_json || { blocks: [] };

  return (
    <div className="container">
      <Link href="/aprendizado">← Aprendizado</Link>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{module.title}</h1>
        <p>{module.description}</p>
        {content.blocks && content.blocks.length > 0 ? (
          <div style={{ marginTop: '1rem' }}>
            {content.blocks.map((b, i) => (
              <div key={i} style={{ marginBottom: '1.5rem' }}>
                {b.type === 'text' && <p>{b.text}</p>}
                {b.type === 'video' && b.url && (
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                    <iframe src={b.url} title={b.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} allowFullScreen />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Conteúdo em construção.</p>
        )}
        {token && (
          <button type="button" className="btn btn-primary" onClick={markComplete} style={{ marginTop: '1rem' }}>
            Marcar como concluído
          </button>
        )}
      </div>
    </div>
  );
}
