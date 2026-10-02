export { MetaAutomationAdapter, buildChildEnv } from './process.js';
export { capabilityMatrix, getActionMapping } from './mapping.js';
export { validateCdpUrl, validatePlatformUrl, PLATFORM_ORIGINS } from './origin-policy.js';
export { classifySecurity } from './security.js';
export { redactLog } from './evidence.js';
export { SyntheticTargetProofProvider, normalizeProfilePath } from './target-proof.js';
export type { BoundControl, TargetProofObservation, TargetProofProvider } from './target-proof.js';
export {
  adapterJobSchema,
  childRequestSchema,
  childResponseSchema,
  planSchema,
  primitiveSchema,
  sha256Content,
  canonicalExecutionContract,
  executionContractHash,
  PREPARATION_TTL_MS,
  META_ADAPTER_VERSION,
  UPSTREAM_COMMIT,
  UPSTREAM_TREE,
  UPSTREAM_PACKAGE_VERSION,
} from './contracts.js';
export type { AdapterHealth, AdapterStatus } from './process.js';
export type { PinVerification } from './pin.js';
export type { AdapterJob, AdapterAction, AdapterPlatform, ChildResponse } from './contracts.js';
