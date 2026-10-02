import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { UPSTREAM_COMMIT, UPSTREAM_PACKAGE_VERSION, UPSTREAM_TREE } from './contracts.js';

export type PinVerification = Readonly<{
  ok: boolean;
  commit: string;
  tree: string;
  packageLockSha256: string;
  licenseSha256: string;
  readmeSha256: string;
  signature: 'UNSIGNED' | 'VERIFIED' | 'UNAVAILABLE';
  sourceClean: boolean;
  reason?: string;
}>;

const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
const git = (root: string, args: string[]) =>
  spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true });

function failed(reason: string): PinVerification {
  return {
    ok: false,
    commit: '',
    tree: '',
    packageLockSha256: '',
    licenseSha256: '',
    readmeSha256: '',
    signature: 'UNAVAILABLE',
    sourceClean: false,
    reason,
  };
}

export function verifyUpstreamPin(root: string): PinVerification {
  const upstream = resolve(root);
  const required = ['package-lock.json', 'LICENSE', 'README.md', '.git'];
  const missing = required.filter((item) => !existsSync(resolve(upstream, item)));
  if (missing.length) return failed(`Missing upstream files: ${missing.join(', ')}`);
  const headResult = git(upstream, ['rev-parse', 'HEAD']);
  const treeResult = git(upstream, ['rev-parse', 'HEAD^{tree}']);
  const originResult = git(upstream, ['remote', 'get-url', 'origin']);
  const statusResult = git(upstream, ['status', '--porcelain', '--untracked-files=all']);
  if ([headResult, treeResult, originResult, statusResult].some((result) => result.status !== 0))
    return failed('PIN_VERIFICATION_ERROR: git command failed');
  const head = headResult.stdout.trim();
  const tree = treeResult.stdout.trim();
  const origin = originResult.stdout.trim();
  const status = statusResult.stdout.trim();
  const signatureResult = git(upstream, ['verify-commit', 'HEAD']);
  if (signatureResult.status === null)
    return failed('PIN_VERIFICATION_ERROR: git verify unavailable');
  const lock = JSON.parse(readFileSync(resolve(upstream, 'package-lock.json'), 'utf8')) as {
    packages?: Record<string, { version?: string }>;
  };
  const version = lock.packages?.['']?.version;
  const forbiddenEnv = existsSync(resolve(upstream, '.env'));
  const sourceClean = status.length === 0 && !forbiddenEnv;
  const packageLockSha256 = sha256(resolve(upstream, 'package-lock.json'));
  const licenseSha256 = sha256(resolve(upstream, 'LICENSE'));
  const readmeSha256 = sha256(resolve(upstream, 'README.md'));
  const manifestPath = resolve(upstream, '..', '..', 'external', 'meta-automation.lock.json');
  if (!existsSync(manifestPath)) return failed('PIN_VERIFICATION_ERROR: lock manifest missing');
  let manifest: {
    repository?: string;
    commit?: string;
    tree?: string;
    packageVersion?: string;
    packageLockSha256?: string;
    licenseSha256?: string;
    readmeSha256?: string;
  };
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as typeof manifest;
  } catch {
    return failed('PIN_VERIFICATION_ERROR: lock manifest invalid');
  }
  const ok =
    origin === manifest.repository &&
    head === manifest.commit &&
    head === UPSTREAM_COMMIT &&
    tree === manifest.tree &&
    tree === UPSTREAM_TREE &&
    version === manifest.packageVersion &&
    version === UPSTREAM_PACKAGE_VERSION &&
    packageLockSha256 === manifest.packageLockSha256 &&
    licenseSha256 === manifest.licenseSha256 &&
    readmeSha256 === manifest.readmeSha256 &&
    sourceClean;
  return {
    ok,
    commit: head,
    tree,
    packageLockSha256,
    licenseSha256,
    readmeSha256,
    signature: signatureResult.status === 0 ? 'VERIFIED' : 'UNSIGNED',
    sourceClean,
    reason: ok
      ? undefined
      : `Pin mismatch or dirty source (origin=${origin}, version=${version}, status=${status || 'clean'}, env=${forbiddenEnv})`,
  };
}
