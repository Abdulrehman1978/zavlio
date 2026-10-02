import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const command = process.argv[2] ?? 'help';
const root = resolve(import.meta.dirname, '..');
const generatedPath = resolve(root, 'packages/db/src/generated/database.types.ts');

function run(args) {
  return new Promise((resolvePromise, reject) => {
    const executable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    const child =
      process.platform === 'win32'
        ? spawn(
            process.env.ComSpec ?? 'cmd.exe',
            ['/d', '/s', '/c', [executable, 'exec', 'supabase', ...args].join(' ')],
            { cwd: root, stdio: 'inherit' },
          )
        : spawn(executable, ['exec', 'supabase', ...args], { cwd: root, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => resolvePromise(code ?? 1));
  });
}

async function generateTypes() {
  const executable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const child =
    process.platform === 'win32'
      ? spawn(
          process.env.ComSpec ?? 'cmd.exe',
          [
            '/d',
            '/s',
            '/c',
            [executable, 'exec', 'supabase', 'gen', 'types', 'typescript', '--local'].join(' '),
          ],
          { cwd: root },
        )
      : spawn(executable, ['exec', 'supabase', 'gen', 'types', 'typescript', '--local'], {
          cwd: root,
        });
  let output = '';
  child.stdout?.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr?.pipe(process.stderr);
  const code = await new Promise((resolvePromise, reject) => {
    child.once('error', reject);
    child.once('exit', (value) => resolvePromise(value ?? 1));
  });
  if (code !== 0) return code;
  await writeFile(generatedPath, output, 'utf8');
  return 0;
}

async function verifyStatic() {
  const config = resolve(root, 'supabase/config.toml');
  const migrations = resolve(root, 'supabase/migrations');
  if (!existsSync(config) || !existsSync(migrations))
    throw new Error('Supabase config or migrations directory is missing.');
  const marker = await readFile(generatedPath, 'utf8');
  if (!marker.includes('export type Database'))
    throw new Error('Generated database type declaration is missing.');
  console.log(
    'Static database verification passed: config, migrations, seed, and generated types are present.',
  );
  return 0;
}

const commands = {
  start: ['start'],
  stop: ['stop'],
  status: ['status'],
  reset: ['db', 'reset', '--yes'],
  migrate: ['migration', 'up'],
  lint: ['db', 'lint'],
  test: ['test', 'db'],
};
let exitCode;
if (command === 'types') exitCode = await generateTypes();
else if (command === 'verify') exitCode = await verifyStatic();
else if (commands[command]) exitCode = await run(commands[command]);
else {
  console.error('Usage: pnpm db:{start|stop|status|reset|migrate|lint|test|types|verify}');
  exitCode = 1;
}
process.exitCode = exitCode;
