import { describe, expect, it } from 'vitest';
import {
  calculateLeadScore,
  scoringModelConfigSchema,
  type LeadSignal,
  type ScoringModelConfig,
} from '@zavlio/crm';

const config: ScoringModelConfig = scoringModelConfigSchema.parse({
  scoreMin: 0,
  scoreCap: 100,
  lookbackDays: 90,
  staleAfterHours: 24,
  thresholds: [
    { intent: 'LOW', min: 0 },
    { intent: 'INTERESTED', min: 25 },
    { intent: 'WARM', min: 50 },
    { intent: 'HIGH', min: 70 },
    { intent: 'PRIORITY', min: 85 },
  ],
  decay: [
    { maxDays: 7, factor: 1 },
    { maxDays: 14, factor: 0.9 },
    { maxDays: 30, factor: 0.75 },
    { maxDays: 60, factor: 0.5 },
    { maxDays: 90, factor: 0.25 },
    { maxDays: null, factor: 0 },
  ],
  serviceKeys: [
    'strategy',
    'brand',
    'design',
    'web',
    'technology',
    'ai_automation',
    'ecommerce',
    'growth',
    'content',
  ],
  signals: [
    {
      key: 'homepage_viewed',
      points: 1,
      cap: 3,
      component: 'behavioral',
      occurrence: 'per_session',
      affinityPoints: 0,
    },
    {
      key: 'service_viewed',
      points: 5,
      cap: 20,
      component: 'behavioral',
      occurrence: 'distinct_entity',
      affinityPoints: 15,
    },
    {
      key: 'project_viewed',
      points: 7,
      cap: 21,
      component: 'behavioral',
      occurrence: 'distinct_entity',
      affinityPoints: 12,
    },
    {
      key: 'return_session',
      points: 8,
      cap: 24,
      component: 'engagement',
      occurrence: 'per_session',
      affinityPoints: 0,
    },
    {
      key: 'start_project_opened',
      points: 15,
      cap: 15,
      component: 'behavioral',
      occurrence: 'once',
      affinityPoints: 0,
    },
    {
      key: 'project_form_started',
      points: 20,
      cap: 20,
      component: 'behavioral',
      occurrence: 'once',
      affinityPoints: 0,
    },
    {
      key: 'project_form_submitted',
      points: 40,
      cap: 40,
      component: 'declared',
      occurrence: 'once',
      affinityPoints: 50,
    },
    {
      key: 'contact_form_submitted',
      points: 30,
      cap: 30,
      component: 'declared',
      occurrence: 'once',
      affinityPoints: 35,
    },
    {
      key: 'budget_supplied',
      points: 10,
      cap: 10,
      component: 'declared',
      occurrence: 'once',
      affinityPoints: 0,
    },
    {
      key: 'high_value_service_combination',
      points: 10,
      cap: 10,
      component: 'declared',
      occurrence: 'once',
      affinityPoints: 10,
    },
  ],
});
const asOf = '2026-09-27T12:00:00.000Z';
const signal = (key: string, days = 0, extra: Partial<LeadSignal> = {}): LeadSignal => ({
  key,
  sourceId: `${key}-${days}-${extra.entityKey ?? ''}`,
  occurredAt: new Date(new Date(asOf).getTime() - days * 86_400_000).toISOString(),
  ...extra,
});

describe('Packet 11 deterministic scoring engine', () => {
  it('caps refresh and distinct-entity signals', () => {
    const signals = [
      ...Array.from({ length: 10 }, (_, i) => signal('homepage_viewed', 0, { sessionId: `s${i}` })),
      ...Array.from({ length: 10 }, () =>
        signal('service_viewed', 0, { entityKey: 'web', affinities: ['web'] }),
      ),
    ];
    const result = calculateLeadScore({ signals, asOf }, config);
    expect(result.score).toBe(8);
    expect(result.affinity.scores.web).toBe(15);
  });
  it('suppresses open/start points after a completed project form', () => {
    const result = calculateLeadScore(
      {
        signals: [
          signal('start_project_opened'),
          signal('project_form_started'),
          signal('project_form_submitted', 0, { affinities: ['web'] }),
          signal('budget_supplied'),
        ],
        asOf,
      },
      config,
    );
    expect(result.score).toBe(50);
    expect(result.intent).toBe('WARM');
  });
  it('decays behavioral but not declared intent', () => {
    const result = calculateLeadScore(
      {
        signals: [
          signal('service_viewed', 40, { entityKey: 'web', affinities: ['web'] }),
          signal('project_form_submitted', 120, { affinities: ['brand'] }),
        ],
        asOf,
      },
      config,
    );
    expect(result.score).toBe(43);
    expect(result.affinity.declared.brand).toBe(50);
    expect(result.affinity.behavioral.web).toBe(8);
  });
  it('drops behavioral signals outside lookback', () => {
    expect(
      calculateLeadScore(
        { signals: [signal('project_viewed', 91, { entityKey: 'old' })], asOf },
        config,
      ).score,
    ).toBe(0);
  });
  it('caps score at 100 and maps priority', () => {
    const signals = Array.from({ length: 5 }, (_, i) =>
      signal('project_form_submitted', 0, { sourceId: `f${i}` }),
    );
    const result = calculateLeadScore(
      {
        signals: [
          ...signals,
          signal('contact_form_submitted'),
          signal('budget_supplied'),
          signal('high_value_service_combination'),
        ],
        asOf,
      },
      config,
    );
    expect(result.score).toBe(90);
    expect(result.intent).toBe('PRIORITY');
  });
  it('keeps declared and behavioral affinity separate', () => {
    const result = calculateLeadScore(
      {
        signals: [
          signal('project_form_submitted', 0, { affinities: ['web', 'brand'] }),
          signal('service_viewed', 0, { entityKey: 'web', affinities: ['web'] }),
        ],
        asOf,
      },
      config,
    );
    expect(result.affinity.declared.web).toBe(50);
    expect(result.affinity.behavioral.web).toBe(15);
    expect(result.affinity.scores.web).toBe(65);
  });
  it('breaks affinity ties deterministically', () => {
    const result = calculateLeadScore(
      { signals: [signal('project_form_submitted', 0, { affinities: ['web', 'brand'] })], asOf },
      config,
    );
    expect(result.affinity.primary).toBe('brand');
    expect(result.affinity.secondary).toBe('web');
  });
  it('is reproducible for identical source state and asOf', () => {
    const input = {
      signals: [
        signal('service_viewed', 5, { entityKey: 'technology', affinities: ['technology'] }),
        signal('return_session', 3, { sessionId: 'two' }),
      ],
      asOf,
    };
    expect(calculateLeadScore(input, config)).toEqual(calculateLeadScore(input, config));
  });
  it('rejects malformed duplicated signal configuration', () => {
    expect(
      scoringModelConfigSchema.safeParse({
        ...config,
        signals: [config.signals[0], config.signals[0]],
      }).success,
    ).toBe(false);
  });
});
