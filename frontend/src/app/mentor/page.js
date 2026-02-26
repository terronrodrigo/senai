'use client';

import { useState, useEffect } from 'react';
import { ai } from '../../lib/api';

export default function MentorPage() {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(false);

  useEffect(() => {
    setToken(!!(typeof window !== 'undefined' && localStorage.getItem('saga_token')));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim() || !token) return;
    setLoading(true);
    setReply(null);
    try {
      const res = await ai.mentor(message);
      setReply(res);
    } catch (err) {
      setReply({ reply: 'Erro ao conectar ao mentor. Faça login e tente novamente.', fromCache: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1>Mentor Virtual (IA)</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Faça perguntas sobre seu projeto, BMC, pitch ou metodologia. Respostas em português.
      </p>
      {!token && (
        <p style={{ background: '#fff3cd', padding: '0.75rem', borderRadius: 6 }}>
          Faça login para usar o mentor.
        </p>
      )}
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Sua pergunta</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Ex.: Como melhorar a viabilidade do meu projeto?" disabled={!token} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !token}>
            {loading ? 'Pensando...' : 'Enviar'}
          </button>
        </form>
        {reply && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--senai-light)', borderRadius: 8 }}>
            <strong>Mentor:</strong> {reply.reply}
            {reply.fromCache && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> (cache)</span>}
          </div>
        )}
      </div>
    </div>
  );
}
