import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DROPPED_FEATURES = ['Drive', 'Custom Agent', 'Sharing'];
const ARTIFACTS_FORBIDDEN_CONTEXT = ['file upload', 'file sharing', 'google drive', 'onedrive', 'dropbox'];
const CREDENTIAL_PATTERNS = [
  /supabase\.co/i,
  /sk-[a-zA-Z0-9]{20,}/,
  /AKIA[A-Z0-9]{16}/,
  /\+1\d{10}(?!\d)/,
  /password\s*[:=]\s*["'][^"']{8,}["']/i,
];
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.env'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', '.next', '.replit', '.local', '.agent_docs', 'attached_assets', 'references', '.cache', '.config', 'public', 'scripts'];

interface Violation {
  file: string;
  line: number;
  rule: string;
  snippet: string;
}

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const isComment = (line: string) => {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (isComment(line)) continue;

    for (const feature of DROPPED_FEATURES) {
      const regex = new RegExp(`\\b${feature}\\b`, 'i');
      if (regex.test(line) && !line.includes('AC-EF') && !line.includes('enforcer')) {
        if (feature === 'Sharing' && (line.includes('social sharing') || line.includes('screen sharing'))) continue;
        if (feature === 'Drive' && (line.toLowerCase().includes('test drive') || line.includes('trade-in') || line.includes('drive scheduled') || line.includes('drive -'))) continue;
        if (filePath.includes('seed.ts') || filePath.includes('mock')) continue;
        violations.push({ file: filePath, line: lineNum, rule: `Dropped feature: "${feature}"`, snippet: line.trim().substring(0, 120) });
      }
    }

    for (const ctx of ARTIFACTS_FORBIDDEN_CONTEXT) {
      if (line.toLowerCase().includes(ctx)) {
        if (ctx === 'file upload' && (line.includes('multer') || line.includes('No file uploaded') || line.includes('upload.single') || line.includes('Coming Soon') || line.includes('future update'))) continue;
        if (filePath.includes('seed.ts') || filePath.includes('mock')) continue;
        violations.push({ file: filePath, line: lineNum, rule: `Artifacts forbidden context: "${ctx}"`, snippet: line.trim().substring(0, 120) });
      }
    }

    for (const pattern of CREDENTIAL_PATTERNS) {
      if (pattern.test(line)) {
        if (filePath.includes('enforcer') || filePath.includes('scripts/')) continue;
        if (filePath.includes('.env.example')) continue;
        if (line.includes('process.env')) continue;
        if (line.includes('import.meta.env')) continue;
        violations.push({ file: filePath, line: lineNum, rule: 'Potential credential exposure', snippet: line.trim().substring(0, 80) + '...' });
      }
    }
  }

  return violations;
}

function walkDir(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.includes(entry.name)) continue;
      results.push(...walkDir(fullPath));
    } else if (entry.isFile() && SCAN_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function runKillSwitchTest(): { passed: boolean; details: string[] } {
  const schemaPath = path.resolve(__dirname, '../shared/schema.ts');
  const content = fs.readFileSync(schemaPath, 'utf-8');
  const details: string[] = [];
  let allPassed = true;

  const channels = ['outboundEnabled', 'smsEnabled', 'phoneEnabled', 'emailEnabled'];
  for (const ch of channels) {
    const regex = new RegExp(`${ch}.*default\\((false|true)\\)`);
    const match = content.match(regex);
    if (match) {
      if (match[1] === 'false') {
        details.push(`✓ ${ch}: default(false)`);
      } else {
        details.push(`✗ ${ch}: default(true) — SHOULD BE false`);
        allPassed = false;
      }
    } else {
      details.push(`✗ ${ch}: not found in schema`);
      allPassed = false;
    }
  }
  return { passed: allPassed, details };
}

const rootDir = path.resolve(__dirname, '..');
console.log('=== Nexxus Connect Enforcer ===\n');

console.log('--- Scanning for dropped features and credentials ---');
const files = walkDir(rootDir);
const allViolations: Violation[] = [];
for (const file of files) {
  allViolations.push(...scanFile(file));
}

if (allViolations.length === 0) {
  console.log('✓ No dropped feature references or credential exposures found.\n');
} else {
  console.log(`✗ ${allViolations.length} violation(s) found:\n`);
  for (const v of allViolations) {
    console.log(`  [${v.rule}] ${v.file}:${v.line}`);
    console.log(`    ${v.snippet}\n`);
  }
}

console.log('--- Kill Switch Default Test ---');
const ksResult = runKillSwitchTest();
for (const d of ksResult.details) {
  console.log(`  ${d}`);
}
console.log(ksResult.passed ? '\n✓ Kill switch defaults: ALL PASS' : '\n✗ Kill switch defaults: FAILED');

const exitCode = allViolations.length > 0 || !ksResult.passed ? 1 : 0;
console.log(`\n=== Enforcer ${exitCode === 0 ? 'PASSED' : 'FAILED'} ===`);
process.exit(exitCode);
