import { readFileSync } from 'fs';
const envContent = readFileSync('/home/ubuntu/Claude-store/nexxus2.2_replit/.env', 'utf-8');
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
}
const pg = await import('pg');
const pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL });
const ids = {
  'serra-honda':         '24d64f99-ba04-4b43-af35-fd06f555ac86',
  'serra-nissan':        '4a23d5ad-38ff-4016-8af5-f4cfc9fd88cd',
  'tony-serra-ford':     '2cbf687f-7cd5-480c-b81c-220cb632cd91',
  'ford-of-columbia':    '6ae2548b-f6ec-4b1e-8d8b-ae565123f0df',
  'hyundai-of-columbia': 'f18cbf4e-bcbd-46fe-bf54-33bcee4afec8',
};
for (const [slug, id] of Object.entries(ids)) {
  const r = await pool.query('SELECT id, name, slug, partner_id FROM organizations WHERE id=$1', [id]);
  console.log(slug, '=>', JSON.stringify(r.rows[0]));
}
console.log('--- yesterday subjects ---');
const r2 = await pool.query("SELECT recipient_email, message_content, sent_at FROM outbound_logs WHERE channel='email' AND message_content LIKE '%Dealership Performance%' AND sent_at > NOW() - INTERVAL '2 days' ORDER BY sent_at DESC LIMIT 10");
for (const row of r2.rows) console.log(row.sent_at, '|', row.recipient_email, '|', (row.message_content||'').slice(0,250));
await pool.end();
