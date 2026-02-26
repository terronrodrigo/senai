import 'dotenv/config';
import { query } from '../db/client.js';
import { consume, QUEUES } from '../lib/queue.js';
import fs from 'fs';

async function processProject(payload) {
  const { projectId } = payload;
  await query(
    `UPDATE projects SET processing_status = 'processing', updated_at = NOW() WHERE id = $1`,
    [projectId]
  );
  try {
    // Validação básica e compressão podem ser adicionadas aqui (ex.: sharp para imagens, ffmpeg para vídeo)
    const r = await query(
      'SELECT file_technical_pdf, file_prior_art_pdf, file_pitch_video, file_bmc FROM projects WHERE id = $1',
      [projectId]
    );
    const row = r.rows[0];
    if (row) {
      for (const path of [row.file_technical_pdf, row.file_prior_art_pdf, row.file_pitch_video, row.file_bmc]) {
        if (path && fs.existsSync(path)) {
          // Placeholder: em produção, comprimir ou mover para S3/EFS
        }
      }
    }
    await query(
      `UPDATE projects SET processing_status = 'done', updated_at = NOW() WHERE id = $1`,
      [projectId]
    );
  } catch (err) {
    console.error('Project process error', projectId, err);
    await query(
      `UPDATE projects SET processing_status = 'failed', updated_at = NOW() WHERE id = $1`,
      [projectId]
    );
  }
}

async function run() {
  await consume('projectProcess', processProject);
  console.log('Worker projectProcess started');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
