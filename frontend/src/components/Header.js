'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const [token, setToken] = useState(null);

  useEffect(() => {
    setToken(typeof window !== 'undefined' ? localStorage.getItem('saga_token') : null);
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem('saga_token');
    setToken(null);
    window.location.href = '/';
  };

  const nav = [
    { href: '/', label: 'Início' },
    { href: '/desafios', label: 'Desafios' },
    { href: '/aprendizado', label: 'Aprendizado' },
    { href: '/mentor', label: 'Mentor IA' },
  ];

  return (
    <header style={{
      background: 'var(--senai-blue)',
      color: 'white',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.5rem',
    }}>
      <Link href="/" style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
        Saga SENAI
      </Link>
      <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {nav.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              color: pathname === href ? 'var(--senai-orange)' : 'rgba(255,255,255,0.9)',
              fontWeight: pathname === href ? 600 : 400,
            }}
          >
            {label}
          </Link>
        ))}
        {token ? (
          <>
            <Link href="/minha-jornada" style={{ color: 'rgba(255,255,255,0.9)' }}>Minha Jornada</Link>
            <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.9)' }}>Dashboard</Link>
            <button type="button" onClick={logout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: 'white', padding: '0.35rem 0.75rem', borderRadius: 6, cursor: 'pointer' }}>
              Sair
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ color: 'rgba(255,255,255,0.9)' }}>Entrar</Link>
            <Link href="/cadastro" style={{ background: 'var(--senai-orange)', color: 'white', padding: '0.35rem 0.75rem', borderRadius: 6 }}>Cadastrar</Link>
          </>
        )}
      </nav>
    </header>
  );
}
