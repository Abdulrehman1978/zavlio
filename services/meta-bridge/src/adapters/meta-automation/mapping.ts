import type { AdapterAction, AdapterPlatform } from './contracts.js';

export type ActionMapping = Readonly<{
  platform: AdapterPlatform;
  action: AdapterAction;
  targetRequired: boolean;
  contentRequired: boolean;
  syntheticExecutable: boolean;
  liveStatus: 'DISABLED';
}>;

const mapping: Record<AdapterPlatform, readonly AdapterAction[]> = {
  THREADS: ['DM', 'REPLY', 'COMMENT', 'LIKE', 'FOLLOW', 'PUBLISH'],
  FACEBOOK: ['REPLY', 'COMMENT', 'LIKE', 'FOLLOW', 'PUBLISH'],
  LINKEDIN: ['DM', 'REPLY', 'COMMENT', 'LIKE', 'FOLLOW', 'CONNECT', 'PUBLISH'],
};

export function getActionMapping(
  platform: AdapterPlatform,
  action: AdapterAction,
): ActionMapping | null {
  if (!mapping[platform].includes(action)) return null;
  return {
    platform,
    action,
    targetRequired: true,
    contentRequired: ['DM', 'REPLY', 'COMMENT', 'PUBLISH'].includes(action),
    syntheticExecutable: true,
    liveStatus: 'DISABLED',
  };
}

export function capabilityMatrix(): Record<AdapterPlatform, readonly AdapterAction[]> {
  return mapping;
}
