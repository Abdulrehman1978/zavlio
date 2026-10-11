import React from 'react';

interface ProjectVisualProps {
  slug: string;
  className?: string;
  aspect?: 'card' | 'showcase';
}

/**
 * ProjectVisual renders crisp, modern architectural schematics and technical
 * blueprints for each studio project. Completely vector-based (SVG), zero raster
 * bundle weight, instantaneous load with zero layout shift, and clearly identified
 * as concept architectural illustrations.
 */
export function ProjectVisual({ slug, className = '', aspect = 'card' }: ProjectVisualProps) {
  const isShowcase = aspect === 'showcase';
  const containerAspect = isShowcase ? 'aspect-[21/9]' : 'aspect-[16/10]';

  switch (slug) {
    case 'kinetiq-systems':
      return (
        <div
          className={`relative w-full ${containerAspect} rounded-2xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 border border-slate-200/80 overflow-hidden p-6 sm:p-8 flex flex-col justify-between shadow-xs group-hover:border-indigo-300 group-hover:shadow-md transition-all duration-300 ${className}`}
          aria-label="Kinetiq Systems Motion Architecture Blueprint"
        >
          {/* Top Metadata */}
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 text-[11px] font-mono text-slate-500">
            <span className="uppercase tracking-widest font-semibold text-slate-800 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              FIG 01.1 · SPRING PHYSICS DAMPING
            </span>
            <span className="text-slate-400">ζ = 0.82 · ω = 14.5 rad/s</span>
          </div>

          {/* Center Schematic SVG */}
          <div className="my-auto w-full max-h-36 sm:max-h-48 flex items-center justify-center">
            <svg
              viewBox="0 0 500 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-slate-900"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="springGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="60%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              {/* Coordinate Grid */}
              <line x1="20" y1="20" x2="480" y2="20" stroke="#E2E8F0" strokeDasharray="3 3" />
              <line x1="20" y1="80" x2="480" y2="80" stroke="#CBD5E1" strokeWidth="1" />
              <line x1="20" y1="140" x2="480" y2="140" stroke="#E2E8F0" strokeDasharray="3 3" />
              <line x1="40" y1="10" x2="40" y2="150" stroke="#CBD5E1" strokeWidth="1" />
              <line x1="160" y1="10" x2="160" y2="150" stroke="#E2E8F0" strokeDasharray="3 3" />
              <line x1="280" y1="10" x2="280" y2="150" stroke="#E2E8F0" strokeDasharray="3 3" />
              <line x1="400" y1="10" x2="400" y2="150" stroke="#E2E8F0" strokeDasharray="3 3" />

              {/* Damped Spring Curve with gradient stroke */}
              <path
                d="M 40 140 C 90 -20, 140 140, 200 60 C 250 95, 300 75, 360 80 L 480 80"
                stroke="url(#springGrad)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Equilibrium Line */}
              <circle cx="200" cy="60" r="5" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="360" cy="80" r="4" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />

              {/* Annotation labels */}
              <text x="50" y="25" fill="#64748B" fontFamily="monospace" fontSize="9">
                DAMPED OVERSHOOT (ILLUSTRATIVE)
              </text>
              <text x="370" y="75" fill="#64748B" fontFamily="monospace" fontSize="9">
                EQUILIBRIUM
              </text>
              <text x="440" y="100" fill="#94A3B8" fontFamily="monospace" fontSize="9">
                t (time) →
              </text>
            </svg>
          </div>

          {/* Bottom Token Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/70 text-[10px] font-mono text-slate-500">
            <span>--token-spring-damping: 0.82 (SPECIFICATION)</span>
            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200/60 font-semibold">
              CONCEPT SCHEMATIC
            </span>
          </div>
        </div>
      );

    case 'aurora-intelligence':
      return (
        <div
          className={`relative w-full ${containerAspect} rounded-2xl bg-gradient-to-br from-slate-50 via-white to-violet-50/40 border border-slate-200/80 overflow-hidden p-6 sm:p-8 flex flex-col justify-between shadow-xs group-hover:border-violet-300 group-hover:shadow-md transition-all duration-300 ${className}`}
          aria-label="Aurora Intelligence Supervisory Graph Topology"
        >
          {/* Top Metadata */}
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 text-[11px] font-mono text-slate-500">
            <span className="uppercase tracking-widest font-semibold text-slate-800 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
              FIG 02.1 · AGENT DECISION TOPOLOGY
            </span>
            <span className="text-slate-400">DAG PROTOCOL · HUMAN GATE</span>
          </div>

          {/* Center Schematic SVG */}
          <div className="my-auto w-full max-h-36 sm:max-h-48 flex items-center justify-center">
            <svg
              viewBox="0 0 500 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-slate-900"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              {/* Directed Connecting Edges */}
              <line x1="85" y1="80" x2="160" y2="45" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="85" y1="80" x2="160" y2="115" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="240" y1="45" x2="310" y2="80" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="240" y1="115" x2="310" y2="80" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="390" y1="80" x2="445" y2="80" stroke="#4F46E5" strokeWidth="2" />

              {/* Node 1: Input Ingestion */}
              <rect
                x="25"
                y="62"
                width="60"
                height="36"
                rx="6"
                fill="#FFFFFF"
                stroke="#64748B"
                strokeWidth="1.5"
              />
              <text
                x="35"
                y="84"
                fill="#0F172A"
                fontFamily="monospace"
                fontSize="9"
                fontWeight="bold"
              >
                PROMPT
              </text>

              {/* Node 2A: Reasoning Trace */}
              <rect
                x="160"
                y="27"
                width="80"
                height="36"
                rx="6"
                fill="#FFFFFF"
                stroke="#94A3B8"
                strokeWidth="1.5"
              />
              <text x="172" y="49" fill="#334155" fontFamily="monospace" fontSize="8">
                CHAIN TREE
              </text>

              {/* Node 2B: Safety Boundary */}
              <rect
                x="160"
                y="97"
                width="80"
                height="36"
                rx="6"
                fill="#FFFFFF"
                stroke="#94A3B8"
                strokeWidth="1.5"
              />
              <text x="175" y="119" fill="#334155" fontFamily="monospace" fontSize="8">
                POLICY VAL
              </text>

              {/* Node 3: Human Verification Checkpoint */}
              <rect
                x="310"
                y="60"
                width="80"
                height="40"
                rx="8"
                fill="#0F172A"
                stroke="#4F46E5"
                strokeWidth="1.5"
              />
              <text
                x="320"
                y="80"
                fill="#38BDF8"
                fontFamily="monospace"
                fontSize="8"
                fontWeight="bold"
              >
                HUMAN GATE
              </text>
              <text x="328" y="92" fill="#94A3B8" fontFamily="monospace" fontSize="7">
                APPROVAL
              </text>

              {/* Node 4: Sandbox Result */}
              <circle cx="460" cy="80" r="16" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2" />
              <text
                x="452"
                y="83"
                fill="#FFFFFF"
                fontFamily="monospace"
                fontSize="8"
                fontWeight="bold"
              >
                EXEC
              </text>
            </svg>
          </div>

          {/* Bottom Token Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/70 text-[10px] font-mono text-slate-500">
            <span>permission_boundary: STRICT_HUMAN_OVERSIGHT</span>
            <span className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200/60 font-semibold">
              PROTOTYPE TOPOLOGY
            </span>
          </div>
        </div>
      );

    case 'strata-commerce':
      return (
        <div
          className={`relative w-full ${containerAspect} rounded-2xl bg-gradient-to-br from-slate-50 via-white to-sky-50/40 border border-slate-200/80 overflow-hidden p-6 sm:p-8 flex flex-col justify-between shadow-xs group-hover:border-sky-300 group-hover:shadow-md transition-all duration-300 ${className}`}
          aria-label="Strata Commerce Edge Routing Architecture"
        >
          {/* Top Metadata */}
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 text-[11px] font-mono text-slate-500">
            <span className="uppercase tracking-widest font-semibold text-slate-800 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
              FIG 03.1 · EDGE ROUTING & CATALOGUE CACHE
            </span>
            <span className="text-slate-400">SSR EDGE · MULTI-CURRENCY BUS</span>
          </div>

          {/* Center Schematic SVG */}
          <div className="my-auto w-full max-h-36 sm:max-h-48 flex items-center justify-center">
            <svg
              viewBox="0 0 500 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-slate-900"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              {/* Architecture Rings */}
              <circle
                cx="250"
                cy="80"
                r="70"
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <circle cx="250" cy="80" r="45" stroke="#CBD5E1" strokeWidth="1" />

              {/* Center Edge Hub */}
              <rect
                x="215"
                y="62"
                width="70"
                height="36"
                rx="6"
                fill="#0F172A"
                stroke="#0EA5E9"
                strokeWidth="1.5"
              />
              <text
                x="228"
                y="84"
                fill="#38BDF8"
                fontFamily="monospace"
                fontSize="9"
                fontWeight="bold"
              >
                EDGE HUB
              </text>

              {/* Edge Nodes */}
              <rect
                x="40"
                y="64"
                width="75"
                height="32"
                rx="6"
                fill="#FFFFFF"
                stroke="#94A3B8"
                strokeWidth="1"
              />
              <text x="50" y="84" fill="#334155" fontFamily="monospace" fontSize="8">
                CATALOGUE
              </text>
              <line
                x1="115"
                y1="80"
                x2="205"
                y2="80"
                stroke="#0EA5E9"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />

              <rect
                x="212"
                y="10"
                width="75"
                height="28"
                rx="6"
                fill="#FFFFFF"
                stroke="#94A3B8"
                strokeWidth="1"
              />
              <text x="225" y="28" fill="#334155" fontFamily="monospace" fontSize="8">
                CURRENCY
              </text>
              <line x1="250" y1="38" x2="250" y2="62" stroke="#CBD5E1" strokeWidth="1.5" />

              <rect
                x="385"
                y="64"
                width="75"
                height="32"
                rx="6"
                fill="#FFFFFF"
                stroke="#94A3B8"
                strokeWidth="1"
              />
              <text x="398" y="84" fill="#334155" fontFamily="monospace" fontSize="8">
                CHECKOUT
              </text>
              <line x1="285" y1="80" x2="385" y2="80" stroke="#0EA5E9" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Bottom Token Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/70 text-[10px] font-mono text-slate-500">
            <span>routing_topology: COMPOSED_CATALOGUE_EDGES</span>
            <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full border border-sky-200/60 font-semibold">
              REFERENCE ARCHITECTURE
            </span>
          </div>
        </div>
      );

    case 'vanguard-identity':
    default:
      return (
        <div
          className={`relative w-full ${containerAspect} rounded-2xl bg-gradient-to-br from-slate-50 via-white to-amber-50/30 border border-slate-200/80 overflow-hidden p-6 sm:p-8 flex flex-col justify-between shadow-xs group-hover:border-amber-300 group-hover:shadow-md transition-all duration-300 ${className}`}
          aria-label="Vanguard Visual Architecture Modular Elevation"
        >
          {/* Top Metadata */}
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 text-[11px] font-mono text-slate-500">
            <span className="uppercase tracking-widest font-semibold text-slate-800 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
              FIG 04.1 · MODULAR ELEVATION & PROPORTIONAL GRID
            </span>
            <span className="text-slate-400">RATIO 1:1.618 · BASELINE 12pt</span>
          </div>

          {/* Center Schematic SVG */}
          <div className="my-auto w-full max-h-36 sm:max-h-48 flex items-center justify-center">
            <svg
              viewBox="0 0 500 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-slate-900"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              {/* Golden Ratio Nested Rectangles */}
              <rect
                x="50"
                y="20"
                width="220"
                height="120"
                rx="4"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <rect
                x="270"
                y="20"
                width="136"
                height="120"
                rx="4"
                stroke="#CBD5E1"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <rect
                x="270"
                y="20"
                width="136"
                height="74"
                rx="4"
                stroke="#CBD5E1"
                strokeWidth="1"
              />
              <rect x="354" y="94" width="52" height="46" rx="4" stroke="#CBD5E1" strokeWidth="1" />

              {/* Architectural Elevation Line */}
              <line x1="30" y1="140" x2="470" y2="140" stroke="#0F172A" strokeWidth="2" />
              <line x1="50" y1="10" x2="50" y2="150" stroke="#E2E8F0" strokeWidth="1" />
              <line x1="406" y1="10" x2="406" y2="150" stroke="#E2E8F0" strokeWidth="1" />

              {/* Typographic Axis */}
              <text
                x="65"
                y="70"
                fill="#0F172A"
                fontFamily="serif"
                fontSize="22"
                fontStyle="italic"
              >
                Vanguard
              </text>
              <text
                x="65"
                y="90"
                fill="#64748B"
                fontFamily="monospace"
                fontSize="8"
                letterSpacing="0.2em"
              >
                SPATIAL PROPORTION
              </text>

              {/* Ratio Mark */}
              <circle cx="270" cy="20" r="4" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.5" />
              <text
                x="280"
                y="16"
                fill="#D97706"
                fontFamily="monospace"
                fontSize="8"
                fontWeight="bold"
              >
                φ = 1.618
              </text>
            </svg>
          </div>

          {/* Bottom Token Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/70 text-[10px] font-mono text-slate-500">
            <span>grid_system: MODULAR_GOLDEN_SECTION</span>
            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200/60 font-semibold">
              STUDIO EXPLORATION
            </span>
          </div>
        </div>
      );
  }
}
