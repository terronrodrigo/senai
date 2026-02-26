import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <section style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <h1 style={{ color: 'var(--senai-blue)', fontSize: '2rem', marginBottom: '0.5rem' }}>
          Saga SENAI de Inovação
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', maxWidth: 600, margin: '0 auto 2rem' }}>
          Plataforma de gestão e operação para Grand Prix, Desafio de Projetos Integradores e Inova SENAI.
          Empreendedorismo e inovação para alunos, docentes e parceiros.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/desafios" className="btn btn-primary">Ver desafios</Link>
          <Link href="/aprendizado" className="btn btn-secondary">Aprendizado</Link>
        </div>
      </section>
      <section className="grid grid-3" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3 style={{ marginTop: 0, color: 'var(--senai-blue)' }}>Grand Prix</h3>
          <p>Maratona de 72h para desenvolvimento de ideias inovadoras.</p>
          <Link href="/desafios?tipo=grand_prix">Saiba mais →</Link>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0, color: 'var(--senai-blue)' }}>Desafio Integradores</h3>
          <p>6 meses para protótipos e projetos integradores.</p>
          <Link href="/desafios?tipo=desafio_integradores">Saiba mais →</Link>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0, color: 'var(--senai-blue)' }}>Inova SENAI</h3>
          <p>Apresentação a investidores e premiação.</p>
          <Link href="/desafios?tipo=inova_senai">Saiba mais →</Link>
        </div>
      </section>
    </div>
  );
}
