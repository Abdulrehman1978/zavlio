import type { AdapterAction, AdapterJob, AdapterPlatform } from './contracts.js';

export type TargetProofObservation = Readonly<{
  url: string;
  username: string | null;
  stableId: string | null;
  profilePath: string | null;
  conversationId: string | null;
}>;

export type BoundControl = Readonly<{
  kind: 'editor' | 'submit';
  targetKey: string;
  action: AdapterAction | null;
  semanticId: string;
  binding: string;
  elementId: number;
}>;

export type SyntheticPage = Readonly<{
  url(): string;
  evaluate<T>(fn: (...args: unknown[]) => T, ...args: unknown[]): Promise<T>;
}>;

type SyntheticElement = {
  children: ArrayLike<SyntheticElement>;
  tagName: string;
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  getBoundingClientRect(): { width: number; height: number };
};
type SyntheticDocument = {
  documentElement: SyntheticElement | null;
  querySelector(selector: string): SyntheticElement | null;
  querySelectorAll(selector: string): ArrayLike<SyntheticElement>;
};

export interface TargetProofProvider {
  observeTarget(): Promise<TargetProofObservation>;
  verifyTarget(job: AdapterJob, observation: TargetProofObservation): void;
  resolveEditorControl(targetKey: string): Promise<BoundControl>;
  resolveSubmitControl(targetKey: string, action: AdapterAction): Promise<BoundControl>;
  resolveBoundControl(binding: string): Promise<BoundControl>;
}

export function normalizeProfilePath(value: string): string {
  if (value.startsWith('/')) return value.replace(/\/+$/, '') || '/';
  const url = new URL(value);
  return url.pathname.replace(/\/+$/, '') || '/';
}

/** Test-only provider. Real platform providers belong to Packet 16. */
export class SyntheticTargetProofProvider implements TargetProofProvider {
  constructor(
    private readonly page: SyntheticPage,
    private readonly platform: AdapterPlatform,
    private readonly testMode: boolean,
  ) {}

  async observeTarget(): Promise<TargetProofObservation> {
    const observed = await this.page.evaluate(() => {
      const doc = (globalThis as unknown as { document: SyntheticDocument }).document;
      const root = doc.querySelector('[data-zavlio-target-proof]');
      const attr = (name: string) => root?.getAttribute(name) ?? null;
      return {
        username: attr('data-zavlio-target-username'),
        stableId: attr('data-zavlio-target-stable-id'),
        profilePath: attr('data-zavlio-target-profile-path'),
        conversationId: attr('data-zavlio-target-conversation-id'),
      };
    });
    return { url: this.page.url(), ...observed };
  }

  verifyTarget(job: AdapterJob, observation: TargetProofObservation): void {
    const target = job.targetIdentity;
    if (target.platform !== this.platform) throw new Error('TARGET_IDENTITY_MISMATCH');
    if (target.username) {
      if (!observation.username) throw new Error('INSUFFICIENT_TARGET_EVIDENCE');
      if (observation.username.toLowerCase() !== target.username.toLowerCase())
        throw new Error('TARGET_IDENTITY_MISMATCH');
    }
    if (target.stableId) {
      if (!observation.stableId) throw new Error('INSUFFICIENT_TARGET_EVIDENCE');
      if (observation.stableId !== target.stableId) throw new Error('TARGET_IDENTITY_MISMATCH');
    }
    if (target.profileUrl) {
      const expected = new URL(target.profileUrl);
      if (
        expected.protocol !== 'https:' &&
        !(this.testMode && ['127.0.0.1', 'localhost', '::1'].includes(expected.hostname))
      )
        throw new Error('ORIGIN_ESCAPE');
      if (!observation.profilePath) throw new Error('INSUFFICIENT_TARGET_EVIDENCE');
      if (normalizeProfilePath(target.profileUrl) !== normalizeProfilePath(observation.profilePath))
        throw new Error('TARGET_IDENTITY_MISMATCH');
    }
    if (target.conversationId) {
      if (!observation.conversationId) throw new Error('INSUFFICIENT_TARGET_EVIDENCE');
      if (observation.conversationId !== target.conversationId)
        throw new Error('TARGET_IDENTITY_MISMATCH');
    }
    if (!target.username && !target.stableId && !target.profileUrl && !target.conversationId)
      throw new Error('INSUFFICIENT_TARGET_EVIDENCE');
  }

  private async resolve(
    kind: 'editor' | 'submit',
    targetKey: string,
    action: AdapterAction | null,
  ) {
    const control = await this.page.evaluate(
      (args) => {
        const {
          kind: requestedKind,
          target: expectedTarget,
          action: expectedAction,
        } = args as {
          kind: 'editor' | 'submit';
          target: string;
          action: AdapterAction | null;
        };
        const doc = (globalThis as unknown as { document: SyntheticDocument }).document;
        const visible = (element: SyntheticElement) => {
          const rect = element.getBoundingClientRect();
          const style = (
            globalThis as unknown as {
              getComputedStyle: (value: unknown) => {
                display: string;
                visibility: string;
                opacity: string;
              };
            }
          ).getComputedStyle(element);
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0'
          );
        };
        const selector =
          requestedKind === 'editor' ? '[data-zavlio-editor-for]' : '[data-zavlio-submit-for]';
        const candidates = Array.from(
          doc.querySelectorAll(selector) as ArrayLike<SyntheticElement>,
        ).filter((element) => {
          if (!visible(element)) return false;
          const target = element.getAttribute(
            requestedKind === 'editor' ? 'data-zavlio-editor-for' : 'data-zavlio-submit-for',
          );
          const candidateAction = element.getAttribute('data-zavlio-action')?.toUpperCase() ?? null;
          return (
            target === expectedTarget &&
            (requestedKind === 'editor' || candidateAction === expectedAction)
          );
        });
        if (candidates.length !== 1)
          return { error: candidates.length === 0 ? 'TARGET_NOT_FOUND' : 'UNVERIFIED' };
        const element = candidates[0];
        if (!element) return { error: 'TARGET_NOT_FOUND' };
        const semanticId = element.getAttribute('data-zavlio-control-id');
        if (!semanticId) return { error: 'UNVERIFIED' };
        const all: SyntheticElement[] = [];
        const walk = (node: SyntheticElement) => {
          all.push(node);
          for (const child of Array.from(node.children as ArrayLike<SyntheticElement>)) walk(child);
        };
        if (doc.documentElement) walk(doc.documentElement);
        let elementId = 0;
        for (const candidate of all) {
          if (!visible(candidate)) continue;
          const tag = candidate.tagName.toLowerCase();
          const role = (candidate.getAttribute('role') ?? tag).toLowerCase();
          const type = (candidate.getAttribute('type') ?? '').toLowerCase();
          const editable =
            candidate.hasAttribute('contenteditable') ||
            tag === 'textarea' ||
            (tag === 'input' && type !== 'hidden') ||
            role === 'textbox';
          const interactive =
            tag === 'button' ||
            tag === 'a' ||
            tag === 'input' ||
            tag === 'textarea' ||
            role === 'button' ||
            role === 'link' ||
            role === 'textbox' ||
            role === 'tab' ||
            role === 'menuitem' ||
            role === 'checkbox' ||
            role === 'switch' ||
            editable ||
            candidate.hasAttribute('tabindex');
          if (!interactive) continue;
          elementId += 1;
          if (candidate === element) break;
        }
        return { semanticId, elementId };
      },
      { kind, target: targetKey, action },
    );
    if ('error' in control && control.error) throw new Error(control.error);
    if (
      !('semanticId' in control) ||
      typeof control.semanticId !== 'string' ||
      typeof control.elementId !== 'number' ||
      !control.elementId
    )
      throw new Error('UNVERIFIED');
    return {
      kind,
      targetKey,
      action,
      semanticId: control.semanticId,
      binding:
        kind === 'editor'
          ? `editor:${targetKey}:${control.semanticId}`
          : `submit:${targetKey}:${action}:${control.semanticId}`,
      elementId: control.elementId,
    } satisfies BoundControl;
  }

  resolveEditorControl(targetKey: string) {
    return this.resolve('editor', targetKey, null);
  }

  resolveSubmitControl(targetKey: string, action: AdapterAction) {
    return this.resolve('submit', targetKey, action);
  }

  async resolveBoundControl(binding: string): Promise<BoundControl> {
    const parts = binding.split(':');
    const kind = parts[0];
    const targetKey = parts[1];
    const action = kind === 'submit' ? parts[2] : undefined;
    const semanticId = kind === 'submit' ? parts[3] : parts[2];
    if (!targetKey || !semanticId || (kind !== 'editor' && kind !== 'submit'))
      throw new Error('UNVERIFIED');
    const expectedAction = kind === 'submit' ? (action as AdapterAction) : null;
    const resolved = await this.resolve(kind, targetKey, expectedAction);
    if (resolved.semanticId !== semanticId) throw new Error('UNVERIFIED');
    return resolved;
  }
}
