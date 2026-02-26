import 'dotenv/config';
import { buildApp } from './app.js';
import { config } from './config.js';

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Saga SENAI API listening on port ${config.port}`);
  } catch (err) {
    app.log?.error(err) || console.error(err);
    process.exit(1);
  }
}

start();
