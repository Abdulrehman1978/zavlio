import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const upstream = resolve(root, 'external/meta-automation');
const run = (args) => {
  try {
    return execFileSync('git', ['-C', upstream, ...args], {
      encoding: 'utf8',
      windowsHide: true,
    }).trim();
  } catch (error) {
    return String(error?.stdout ?? error?.message ?? '').trim();
  }
};
console.log(
  JSON.stringify(
    {
      command: 'meta:inspect-upstream',
      pinnedHead: run(['rev-parse', 'HEAD']),
      remoteHead: run(['ls-remote', 'origin', 'HEAD']),
      changedFiles: run(['diff', '--name-only', 'HEAD']),
      note: 'Report-only; this command never fetches, checks out, or modifies the pinned source.',
    },
    null,
    2,
  ),
);
