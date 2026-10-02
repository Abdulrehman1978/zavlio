import { z } from 'zod';

export const SERVICE_KEYS = [
  'strategy',
  'brand',
  'design',
  'web',
  'technology',
  'ai_automation',
  'ecommerce',
  'growth',
  'content',
] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];
export type ScoreComponent = 'behavioral' | 'declared' | 'engagement' | 'commercial';
export type OccurrenceRule = 'once' | 'distinct_entity' | 'per_session' | 'each';

const signalRuleSchema = z.object({
  key: z.string().min(1).max(80),
  points: z.number().int().min(0).max(100),
  cap: z.number().int().min(0).max(100),
  component: z.enum(['behavioral', 'declared', 'engagement', 'commercial']),
  occurrence: z.enum(['once', 'distinct_entity', 'per_session', 'each']),
  affinityPoints: z.number().int().min(0).max(100).default(0),
});
const thresholdSchema = z.object({
  intent: z.enum(['LOW', 'INTERESTED', 'WARM', 'HIGH', 'PRIORITY']),
  min: z.number().int().min(0).max(100),
});
const decayTierSchema = z.object({
  maxDays: z.number().int().positive().nullable(),
  factor: z.number().min(0).max(1),
});

export const scoringModelConfigSchema = z
  .object({
    scoreMin: z.number().int().min(0).max(100).default(0),
    scoreCap: z.number().int().min(1).max(100),
    lookbackDays: z.number().int().min(1).max(730),
    staleAfterHours: z.number().int().min(1).max(2160),
    thresholds: z.array(thresholdSchema).length(5),
    decay: z.array(decayTierSchema).min(1),
    signals: z.array(signalRuleSchema).min(1),
    serviceKeys: z.array(z.enum(SERVICE_KEYS)).length(SERVICE_KEYS.length),
  })
  .superRefine((config, ctx) => {
    if (new Set(config.signals.map((rule) => rule.key)).size !== config.signals.length)
      ctx.addIssue({ code: 'custom', message: 'signal keys must be unique' });
    const thresholds = [...config.thresholds].sort((a, b) => a.min - b.min);
    if (thresholds.some((threshold, index) => threshold.min !== [0, 25, 50, 70, 85][index]))
      ctx.addIssue({ code: 'custom', message: 'intent thresholds must be 0,25,50,70,85' });
    if (config.decay.at(-1)?.maxDays !== null)
      ctx.addIssue({ code: 'custom', message: 'decay must include a final open-ended tier' });
  });

export type ScoringModelConfig = z.infer<typeof scoringModelConfigSchema>;
export type LeadSignal = {
  key: string;
  occurredAt: string;
  sourceId: string;
  entityKey?: string;
  sessionId?: string;
  affinities?: ServiceKey[];
};
export type ScoreReason = {
  signal: string;
  sourceIds: string[];
  occurrences: number;
  basePoints: number;
  cap: number;
  decayFactor: number;
  effectivePoints: number;
};
export type LeadScoreResult = {
  score: number;
  intent: 'LOW' | 'INTERESTED' | 'WARM' | 'HIGH' | 'PRIORITY';
  components: Record<ScoreComponent, number> & { raw: number; final: number };
  reasoning: ScoreReason[];
  affinity: {
    scores: Partial<Record<ServiceKey, number>>;
    declared: Partial<Record<ServiceKey, number>>;
    behavioral: Partial<Record<ServiceKey, number>>;
    primary: ServiceKey | null;
    secondary: ServiceKey | null;
  };
};

function ageDays(occurredAt: string, asOf: Date) {
  return Math.max(0, (asOf.getTime() - new Date(occurredAt).getTime()) / 86_400_000);
}
function decayFactor(age: number, config: ScoringModelConfig) {
  return config.decay.find((tier) => tier.maxDays === null || age <= tier.maxDays)?.factor ?? 0;
}
function selectedSignals(signals: LeadSignal[], occurrence: OccurrenceRule) {
  const sorted = [...signals].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime() ||
      a.sourceId.localeCompare(b.sourceId),
  );
  if (occurrence === 'once') return sorted.slice(0, 1);
  if (occurrence === 'distinct_entity') {
    const seen = new Set<string>();
    return sorted.filter((signal) => {
      const key = signal.entityKey ?? signal.sourceId;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  if (occurrence === 'per_session') {
    const seen = new Set<string>();
    return sorted.filter((signal) => {
      const key = signal.sessionId ?? signal.sourceId;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return sorted;
}

export function calculateLeadScore(
  input: { signals: LeadSignal[]; asOf: string },
  unvalidatedConfig: ScoringModelConfig,
): LeadScoreResult {
  const config = scoringModelConfigSchema.parse(unvalidatedConfig);
  const asOf = new Date(input.asOf);
  if (Number.isNaN(asOf.getTime())) throw new Error('asOf must be an ISO timestamp');
  const hasProjectCompletion = input.signals.some(
    (signal) => signal.key === 'project_form_submitted',
  );
  const signals = input.signals.filter(
    (signal) =>
      !(
        hasProjectCompletion &&
        ['start_project_opened', 'project_form_started'].includes(signal.key)
      ),
  );
  const components = { behavioral: 0, declared: 0, engagement: 0, commercial: 0, raw: 0, final: 0 };
  const reasoning: ScoreReason[] = [];
  const declared: Partial<Record<ServiceKey, number>> = {};
  const behavioral: Partial<Record<ServiceKey, number>> = {};
  for (const rule of config.signals) {
    let candidates = signals.filter((signal) => signal.key === rule.key);
    if (rule.component === 'behavioral' || rule.component === 'engagement')
      candidates = candidates.filter(
        (signal) => ageDays(signal.occurredAt, asOf) <= config.lookbackDays,
      );
    const selected = selectedSignals(candidates, rule.occurrence);
    if (!selected.length) continue;
    const pointsBeforeDecay = Math.min(rule.cap, selected.length * rule.points);
    const factor =
      rule.component === 'behavioral' || rule.component === 'engagement'
        ? decayFactor(
            Math.min(...selected.map((signal) => ageDays(signal.occurredAt, asOf))),
            config,
          )
        : 1;
    const effectivePoints = Math.round(pointsBeforeDecay * factor);
    components[rule.component] += effectivePoints;
    reasoning.push({
      signal: rule.key,
      sourceIds: selected.map((signal) => signal.sourceId).sort(),
      occurrences: selected.length,
      basePoints: pointsBeforeDecay,
      cap: rule.cap,
      decayFactor: factor,
      effectivePoints,
    });
    for (const signal of selected) {
      for (const affinity of signal.affinities ?? []) {
        const bucket = rule.component === 'declared' ? declared : behavioral;
        const affinityFactor = rule.component === 'declared' ? 1 : factor;
        bucket[affinity] = Math.min(
          100,
          (bucket[affinity] ?? 0) + Math.round(rule.affinityPoints * affinityFactor),
        );
      }
    }
  }
  components.raw =
    components.behavioral + components.declared + components.engagement + components.commercial;
  components.final = Math.max(config.scoreMin, Math.min(config.scoreCap, components.raw));
  const intent =
    [...config.thresholds]
      .sort((a, b) => b.min - a.min)
      .find((threshold) => components.final >= threshold.min)?.intent ?? 'LOW';
  const scores: Partial<Record<ServiceKey, number>> = {};
  for (const key of SERVICE_KEYS) {
    const value = Math.min(100, (declared[key] ?? 0) + (behavioral[key] ?? 0));
    if (value) scores[key] = value;
  }
  const ranked = Object.entries(scores).sort(
    ([aKey, aScore], [bKey, bScore]) => bScore - aScore || aKey.localeCompare(bKey),
  ) as Array<[ServiceKey, number]>;
  return {
    score: components.final,
    intent,
    components,
    reasoning: reasoning.sort(
      (a, b) => b.effectivePoints - a.effectivePoints || a.signal.localeCompare(b.signal),
    ),
    affinity: {
      scores,
      declared,
      behavioral,
      primary: ranked[0]?.[0] ?? null,
      secondary: ranked[1]?.[0] ?? null,
    },
  };
}
