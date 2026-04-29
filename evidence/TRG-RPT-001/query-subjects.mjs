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
const r = await pool.query("SELECT action, entity_type, metadata, created_at FROM activity_log WHERE created_at > NOW() - INTERVAL '2 days' AND (action ILIKE '%weekly%' OR action ILIKE '%report%' OR entity_type ILIKE '%weekly%' OR entity_type ILIKE '%report%' OR metadata::text ILIKE '%Dealership%') ORDER BY created_at DESC LIMIT 20");
console.log('matching rows:', r.rows.length);
for (const row of r.rows) console.log(row.created_at.toISOString(), '|', row.action, '|', row.entity_type, '|', JSON.stringify(row.metadata).slice(0,400));
await pool.end();
