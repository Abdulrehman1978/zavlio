import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const upstream = resolve(root, 'external/meta-automation');
const manifest = JSON.parse(
  readFileSync(resolve(root, 'external/meta-automation.lock.json'), 'utf8'),
);
const git = (...args) => {
  try {
    return {
      ok: true,
      value: execFileSync('git', ['-C', upstream, ...args], {
        encoding: 'utf8',
        windowsHide: true,
      }).trim(),
    };
  } catch (error) {
    return {
      ok: false,
      value: '',
      error: error instanceof Error ? error.message.slice(0, 160) : 'git failure',
    };
  }
};
const repository = git('remote', 'get-url', 'origin');
const commit = git('rev-parse', 'HEAD');
const tree = git('rev-parse', 'HEAD^{tree}');
const sourceStatus = git('status', '--porcelain', '--untracked-files=all');
const sha256 = (file) =>
  createHash('sha256')
    .update(readFileSync(resolve(upstream, file)))
    .digest('hex');
const checks = {
  repository: repository.ok && repository.value === manifest.repository,
  commit: commit.ok && commit.value === manifest.commit,
  tree: tree.ok && tree.value === manifest.tree,
  packageLock: sha256('package-lock.json') === manifest.packageLockSha256,
  license: sha256('LICENSE') === manifest.licenseSha256,
  readme: sha256('README.md') === manifest.readmeSha256,
  sourceClean:
    sourceStatus.ok && sourceStatus.value === '' && !existsSync(resolve(upstream, '.env')),
};
const subprocessFailure = [repository, commit, tree, sourceStatus].some((result) => !result.ok);
const result = {
  command: 'meta:verify-pin',
  manifest,
  checks,
  status: subprocessFailure
    ? 'PIN_VERIFICATION_ERROR'
    : Object.values(checks).every(Boolean)
      ? 'PASS'
      : 'FAIL',
};
console.log(JSON.stringify(result, null, 2));
if (result.status !== 'PASS') process.exitCode = 1;
