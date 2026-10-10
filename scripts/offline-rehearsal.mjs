#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';

const root = resolve(process.cwd());

const stages = [
  { name: 'Secret & Credential Scan', command: 'node scripts/secret-scan.mjs' },
  { name: 'Log Redaction & PII Safety', command: 'node scripts/log-redaction-test.mjs' },
  { name: 'Meta Automation Upstream Pin & Integrity', command: 'node scripts/meta-verify-pin.mjs' },
  { name: 'Database Static Schema & Asset Verification', command: 'node scripts/db.mjs verify' },
  {
    name: 'Meta Adapter CDP Isolation (Synthetic Browser)',
    command: 'node scripts/meta-adapter-runtime-test.mjs',
  },
  {
    name: 'Social Provider Dry-Run & Instagram Unsupported Checks',
    command: 'node scripts/social-provider-runtime-test.mjs',
  },
  {
    name: 'Automated 27-Route SEO Crawl & Static HTML Audit',
    command: 'node scripts/seo-crawl-audit.mjs',
  },
  { name: 'Vitest Unit Test Suite (110 Tests)', command: 'pnpm test:unit' },
  { name: 'Monorepo TypeScript Verification', command: 'pnpm typecheck' },
  { name: 'Monorepo ESLint & Prettier Verification', command: 'pnpm lint' },
  { name: 'Next.js Production Build & SSG Generation', command: 'pnpm build' },
];

async function runCommand(cmdString) {
  const parts = cmdString.split(' ');
  const cmd = parts[0];
  const args = parts.slice(1);

  const executable = process.platform === 'win32' && cmd === 'pnpm' ? 'pnpm.cmd' : cmd;

  return new Promise((res) => {
    const start = Date.now();
    const child = spawn(executable, args, { cwd: root, stdio: 'pipe', shell: true });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (d) => (stdout += d.toString()));
    child.stderr?.on('data', (d) => (stderr += d.toString()));

    child.on('close', (code) => {
      const durationMs = Date.now() - start;
      res({
        code,
        durationMs,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}

console.log('=== ZAVLIO OFFLINE PRE-DEPLOYMENT REHEARSAL HARNESS (19-PREP) ===');
console.log(`Starting execution across ${stages.length} offline verification stages...\n`);

const report = {
  timestamp: new Date().toISOString(),
  environment: 'Local Offline Disposable Workspace',
  totalStages: stages.length,
  passedStages: 0,
  failedStages: 0,
  results: [],
};

for (const stage of stages) {
  process.stdout.write(`[RUNNING] ${stage.name}... `);
  const result = await runCommand(stage.command);

  if (result.code === 0) {
    process.stdout.write(`PASS (${result.durationMs}ms)\n`);
    report.passedStages += 1;
    report.results.push({
      stage: stage.name,
      command: stage.command,
      status: 'PASS',
      durationMs: result.durationMs,
    });
  } else {
    process.stdout.write(`FAIL (${result.durationMs}ms)\n`);
    report.failedStages += 1;
    report.results.push({
      stage: stage.name,
      command: stage.command,
      status: 'FAIL',
      durationMs: result.durationMs,
      stderr: result.stderr.slice(0, 500),
    });
  }
}

const outputPath = resolve(root, 'docs/work/offline-rehearsal-report.json');
await writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8');

console.log('\n=== REHEARSAL SUMMARY ===');
console.log(`Passed: ${report.passedStages}/${stages.length}`);
console.log(`Failed: ${report.failedStages}/${stages.length}`);
console.log(`Report written to docs/work/offline-rehearsal-report.json\n`);

if (report.failedStages === 0) {
  console.log('STATUS: READY_FOR_HOSTED_REHEARSAL');
  process.exit(0);
} else {
  console.error('STATUS: REHEARSAL_STAGE_FAILED');
  process.exit(1);
}
