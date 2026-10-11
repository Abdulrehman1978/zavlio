'use client';

import { useState } from 'react';
import { Card, Eyebrow, Badge } from '@zavlio/ui';

export interface CycleStage {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  description: string;
  deliverables: string[];
}

export const CYCLE_STAGES: CycleStage[] = [
  {
    id: 'idea',
    number: '01',
    name: 'IDEA',
    subtitle: 'Strategic thesis & positioning',
    description:
      'Every transformative digital venture starts with rigorous clarity. We interrogate market assumptions, define unique product angles, and crystallize architectural theses before writing a line of code.',
    deliverables: [
      'Problem Definition',
      'Market Strategy',
      'Product Scope Spec',
      'Architecture Roadmap',
    ],
  },
  {
    id: 'identity',
    number: '02',
    name: 'IDENTITY',
    subtitle: 'Design language & visual tokens',
    description:
      'We forge a distinctive aesthetic voice—from editorial typography and restrained color systems to tactile design tokens—ensuring the brand commands attention and communicates pedigree.',
    deliverables: [
      'Visual Identity System',
      'Typography Stacks',
      'Design Tokens',
      'Asset Guidelines',
    ],
  },
  {
    id: 'experience',
    number: '03',
    name: 'EXPERIENCE',
    subtitle: 'Digital product & web craft',
    description:
      'We bring the brand to life across responsive web applications, mobile interfaces, and digital products that combine editorial beauty, fluid interactions, and axe-audited accessible semantics.',
    deliverables: [
      'Responsive Web App',
      'Design System Library',
      'Micro-Interactions',
      'Interactive Prototypes',
    ],
  },
  {
    id: 'system',
    number: '04',
    name: 'SYSTEM',
    subtitle: 'Engineering & backend infrastructure',
    description:
      'A great experience requires an unshakeable technical foundation. We engineer relational database models, server-rendered edge platforms, strict RBAC security, and resilient automation protocols.',
    deliverables: [
      'Full-Stack Platform',
      'Relational Schema',
      'Automated Test Suites',
      'CI/CD Release Gates',
    ],
  },
  {
    id: 'growth',
    number: '05',
    name: 'GROWTH',
    subtitle: 'Conversion funnels & attribution',
    description:
      'We deploy privacy-first analytics, high-intent lead intake funnels, technical SEO foundations, and automated operational pipelines that compound market reach without third-party surveillance.',
    deliverables: [
      'Intake Workflows',
      'Attribution Pipelines',
      'Technical SEO Hierarchy',
      'CRM Integrations',
    ],
  },
  {
    id: 'insight',
    number: '06',
    name: 'INSIGHT',
    subtitle: 'Empirical telemetry & learning',
    description:
      'Continuous measurement transforms subjective opinion into empirical evidence. We aggregate first-party event telemetry, customer lifecycle trends, and system performance metrics.',
    deliverables: [
      'Executive Dashboards',
      'Funnel Analytics',
      'Attribution Intelligence',
      'Performance Audits',
    ],
  },
  {
    id: 'loop',
    number: '07',
    name: 'IDEA',
    subtitle: 'Next-generation evolution',
    description:
      'Insights loop back into the strategic core. Products don’t finish at launch—they evolve through informed experimentation, feature iteration, and disciplined technical stewardship.',
    deliverables: [
      'Evolution Roadmaps',
      'Lab Experiments',
      'Feature Prioritization',
      'Compound Value',
    ],
  },
];

export function OperatingCycle() {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const activeStage = CYCLE_STAGES[activeStageIndex] ?? CYCLE_STAGES[0]!;

  return (
    <div className="w-full space-y-8">
      {/* Horizontal / Grid Timeline Navigation */}
      <div
        role="tablist"
        aria-label="Operating cycle stages"
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pb-2"
      >
        {CYCLE_STAGES.map((stage, idx) => {
          const isSelected = idx === activeStageIndex;
          return (
            <button
              key={`${stage.id}-${idx}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              id={`cycle-tab-${idx}`}
              aria-controls={`cycle-panel-${idx}`}
              onClick={() => setActiveStageIndex(idx)}
              className={`group flex flex-col items-start p-4 text-left rounded-xl border transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md transform -translate-y-0.5'
                  : 'bg-white text-slate-800 border-slate-200/80 shadow-xs hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span
                  className={`font-mono text-[11px] font-bold tracking-wider ${
                    isSelected ? 'text-indigo-400' : 'text-slate-600'
                  }`}
                >
                  {stage.number}
                </span>
                {idx < CYCLE_STAGES.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`text-xs transition-transform group-hover:translate-x-0.5 ${
                      isSelected ? 'text-indigo-400' : 'text-slate-500'
                    }`}
                  >
                    →
                  </span>
                )}
                {idx === CYCLE_STAGES.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`text-xs font-mono ${
                      isSelected ? 'text-indigo-400' : 'text-slate-500'
                    }`}
                  >
                    ↺
                  </span>
                )}
              </div>
              <span className="font-sans text-sm font-bold tracking-tight">{stage.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Stage Detailed View */}
      <div
        role="tabpanel"
        id={`cycle-panel-${activeStageIndex}`}
        aria-labelledby={`cycle-tab-${activeStageIndex}`}
        className="w-full"
      >
        <Card
          hover={false}
          className="bg-white/95 border border-slate-200/80 rounded-2xl p-8 sm:p-12 shadow-sm"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="accent">{`STAGE ${activeStage.number}`}</Badge>
                <Eyebrow>{activeStage.subtitle}</Eyebrow>
              </div>

              <h3 className="font-sans text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {activeStage.name}
              </h3>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                {activeStage.description}
              </p>
            </div>

            <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-200/80 pt-6 lg:pt-0 lg:pl-8 space-y-3">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-600 block mb-3 font-semibold">
                Core Deliverables
              </span>
              <ul className="space-y-2.5">
                {activeStage.deliverables.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm font-medium text-slate-800 bg-slate-50/80 px-3.5 py-2 rounded-xl border border-slate-100"
                  >
                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
