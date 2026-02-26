import './globals.css';
import { Header } from '../components/Header';

export const metadata = {
  title: 'Saga SENAI de Inovação',
  description: 'Plataforma de Gestão e Operação da Saga SENAI de Inovação',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
