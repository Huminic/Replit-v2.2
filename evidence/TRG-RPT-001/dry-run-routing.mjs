// Dry-run: resolve routing for all 5 stores, log, verify sanity, NO SENDS.
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

const svc = await import('/home/ubuntu/Claude-store/nexxus2.2_replit/server/services/weeklyReportService.ts');
const pg = await import('pg');
const pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL });

const STORES = [
  { slug: 'serra-honda',         orgId: '24d64f99-ba04-4b43-af35-fd06f555ac86', agent: 'Caroline',  orgName: 'Serra Honda' },
  { slug: 'serra-nissan',        orgId: '4a23d5ad-38ff-4016-8af5-f4cfc9fd88cd', agent: 'Magnolia',  orgName: 'Serra Nissan' },
  { slug: 'tony-serra-ford',     orgId: '2cbf687f-7cd5-480c-b81c-220cb632cd91', agent: 'Georgia',   orgName: 'Tony Serra Ford' },
  { slug: 'ford-of-columbia',    orgId: '6ae2548b-f6ec-4b1e-8d8b-ae565123f0df', agent: 'Savannah',  orgName: 'Ford of Columbia' },
  { slug: 'hyundai-of-columbia', orgId: 'f18cbf4e-bcbd-46fe-bf54-33bcee4afec8', agent: 'Elizabeth', orgName: 'Hyundai of Columbia' },
];

console.log('SAFETY_NET_BCC_EMAIL =', svc.SAFETY_NET_BCC_EMAIL);

let anyFail = false;
for (const s of STORES) {
  const r = await pool.query('SELECT id, name, partner_id FROM organizations WHERE id=$1', [s.orgId]);
  const org = { id: r.rows[0].id, name: r.rows[0].name, partnerId: r.rows[0].partner_id };
  const routing = await svc.resolveOrgRouting(org);
  const failures = [];
  const toLower = routing.to.map(e => e.toLowerCase());
  const ccLower = routing.cc.map(e => e.toLowerCase());
  if (toLower.includes('duane.wells@huminic.ai')) failures.push('duane in To');
  if (ccLower.includes('duane.wells@huminic.ai')) failures.push('duane in Cc');
  for (const e of routing.to) if (e.toLowerCase().endsWith('@huminic.ai')) failures.push(`@huminic.ai in To: ${e}`);
  for (const e of routing.cc) if (e.toLowerCase().endsWith('@huminic.ai')) failures.push(`@huminic.ai in Cc: ${e}`);
  if (routing.to.length === 0) failures.push('empty To');
  console.log(`\n${s.orgName} (${s.slug}):`);
  console.log(`  agent: ${s.agent}`);
  console.log(`  To:   [${routing.to.join(', ')}]  (count=${routing.to.length})`);
  console.log(`  Cc:   [${routing.cc.join(', ')}]  (count=${routing.cc.length})`);
  console.log(`  Bcc:  [${routing.bcc.join(', ')}]  (count=${routing.bcc.length})`);
  if (routing.toExcluded.length) console.log('  toExcluded:', JSON.stringify(routing.toExcluded));
  if (routing.ccExcluded.length) console.log('  ccExcluded:', JSON.stringify(routing.ccExcluded));
  console.log(`  sanity: ${failures.length === 0 ? 'PASS' : 'FAIL - ' + failures.join(', ')}`);
  if (failures.length) anyFail = true;
}

console.log('\n---');
console.log(anyFail ? 'ABORT — one or more stores failed sanity' : 'ALL 5 STORES PASS SANITY — OK to run the real send');
await pool.end();
process.exit(anyFail ? 1 : 0);
