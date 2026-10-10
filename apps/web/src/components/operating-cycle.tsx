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
      'We bring the brand to life across responsive web applications, mobile interfaces, and digital products that combine editorial beauty, fluid interactions, and WCAG 2.2 AA accessibility.',
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
    <div className="w-full">
      {/* Horizontal / Grid Timeline Navigation */}
      <div
        role="tablist"
        aria-label="Operating cycle stages"
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 border-b border-[#D8D4CA] pb-4 mb-8"
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
              className={`group flex flex-col items-start p-3 text-left border transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0D0D0D] ${
                isSelected
                  ? 'bg-[#0D0D0D] text-[#FAF8F4] border-[#0D0D0D]'
                  : 'bg-[#FAF8F4] text-[#0D0D0D] border-[#D8D4CA] hover:border-[#BBB6AA] hover:bg-[#FFFFFF]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`font-mono text-[10px] tracking-wider ${
                    isSelected ? 'text-[#D8FF45]' : 'text-[#646059]'
                  }`}
                >
                  {stage.number}
                </span>
                {idx < CYCLE_STAGES.length - 1 && (
                  <span
                    className={`text-xs ${
                      isSelected ? 'text-[#D8FF45]' : 'text-[#BBB6AA] group-hover:text-[#0D0D0D]'
                    }`}
                  >
                    →
                  </span>
                )}
                {idx === CYCLE_STAGES.length - 1 && (
                  <span
                    className={`text-xs font-mono ${
                      isSelected ? 'text-[#D8FF45]' : 'text-[#BBB6AA]'
                    }`}
                  >
                    ↺
                  </span>
                )}
              </div>
              <span className="font-serif text-sm font-semibold tracking-tight">{stage.name}</span>
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
        <Card hover={false} className="bg-[#FAF8F4] border border-[#D8D4CA] p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="accent">{`STAGE ${activeStage.number}`}</Badge>
                <Eyebrow>{activeStage.subtitle}</Eyebrow>
              </div>

              <h3 className="font-serif text-3xl sm:text-4xl text-[#0D0D0D] tracking-tight">
                {activeStage.name}
              </h3>

              <p className="text-base sm:text-lg text-[#383530] leading-relaxed max-w-2xl">
                {activeStage.description}
              </p>
            </div>

            <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-[#D8D4CA] pt-6 lg:pt-0 lg:pl-8 space-y-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[#646059] block mb-2">
                Core Deliverables
              </span>
              <ul className="space-y-2">
                {activeStage.deliverables.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#0D0D0D]">
                    <span className="h-1.5 w-1.5 bg-[#0D0D0D] rounded-full" />
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
