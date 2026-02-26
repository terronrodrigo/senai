import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO regions (name, code) VALUES
        ('São Paulo', 'SP'),
        ('Minas Gerais', 'MG'),
        ('Santa Catarina', 'SC'),
        ('Rio Grande do Sul', 'RS'),
        ('Bahia', 'BA')
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('Regions seed done.');
    const mod = await client.query(`
      INSERT INTO learning_modules (title, slug, description, content_json, order_index, is_published)
      VALUES ('Introdução à Metodologia SENAI', 'introducao-metodologia', 'Conceitos da MSPE e inovação.', '{"blocks":[{"type":"text","text":"Conteúdo sobre metodologia e inovação."}]}', 1, true)
      ON CONFLICT (slug) DO NOTHING
    `).catch(() => null);
    if (mod) console.log('Learning module seed done.');
  } catch (e) {
    console.error('Seed error', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
