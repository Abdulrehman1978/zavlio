import React from 'react';

interface ProjectVisualProps {
  slug: string;
  className?: string;
  aspect?: 'card' | 'showcase';
}

/**
 * ProjectVisual renders crisp, original architectural schematics and technical
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
          className={`relative w-full ${containerAspect} bg-[#EFECE3] border border-[#D8D4CA] overflow-hidden p-6 sm:p-8 flex flex-col justify-between transition-colors group-hover:bg-[#EAE6DC] ${className}`}
          aria-label="Kinetiq Systems Motion Architecture Blueprint"
        >
          {/* Top Metadata */}
          <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3 text-[10px] font-mono text-[#524F47]">
            <span className="uppercase tracking-widest font-semibold text-[#0D0D0D]">
              FIG 01.1 · SPRING PHYSICS DAMPING
            </span>
            <span>ζ = 0.82 · ω = 14.5 rad/s (DESIGN PARAMETERS)</span>
          </div>

          {/* Center Schematic SVG */}
          <div className="my-auto w-full max-h-36 sm:max-h-48 flex items-center justify-center">
            <svg
              viewBox="0 0 500 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-[#0D0D0D]"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              {/* Coordinate Grid */}
              <line x1="20" y1="20" x2="480" y2="20" stroke="#D8D4CA" strokeDasharray="3 3" />
              <line x1="20" y1="80" x2="480" y2="80" stroke="#BBB6AA" strokeWidth="1" />
              <line x1="20" y1="140" x2="480" y2="140" stroke="#D8D4CA" strokeDasharray="3 3" />
              <line x1="40" y1="10" x2="40" y2="150" stroke="#BBB6AA" strokeWidth="1" />
              <line x1="160" y1="10" x2="160" y2="150" stroke="#D8D4CA" strokeDasharray="3 3" />
              <line x1="280" y1="10" x2="280" y2="150" stroke="#D8D4CA" strokeDasharray="3 3" />
              <line x1="400" y1="10" x2="400" y2="150" stroke="#D8D4CA" strokeDasharray="3 3" />

              {/* Damped Spring Curve */}
              <path
                d="M 40 140 C 90 -20, 140 140, 200 60 C 250 95, 300 75, 360 80 L 480 80"
                stroke="#0D0D0D"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Equilibrium Line */}
              <circle cx="200" cy="60" r="4" fill="#D8FF45" stroke="#0D0D0D" strokeWidth="1.5" />
              <circle cx="360" cy="80" r="3" fill="#0D0D0D" />

              {/* Annotation labels */}
              <text x="50" y="25" fill="#524F47" fontFamily="monospace" fontSize="9">
                DAMPED OVERSHOOT (ILLUSTRATIVE)
              </text>
              <text x="370" y="75" fill="#524F47" fontFamily="monospace" fontSize="9">
                EQUILIBRIUM
              </text>
              <text x="440" y="100" fill="#646059" fontFamily="monospace" fontSize="9">
                t (time) →
              </text>
            </svg>
          </div>

          {/* Bottom Token Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#D8D4CA] text-[9px] font-mono text-[#524F47]">
            <span>--token-spring-damping: 0.82 (SPECIFICATION)</span>
            <span className="bg-[#FAF8F4] px-1.5 py-0.5 border border-[#D8D4CA]">
              CONCEPT SCHEMATIC
            </span>
          </div>
        </div>
      );

    case 'aurora-intelligence':
      return (
        <div
          className={`relative w-full ${containerAspect} bg-[#EFECE3] border border-[#D8D4CA] overflow-hidden p-6 sm:p-8 flex flex-col justify-between transition-colors group-hover:bg-[#EAE6DC] ${className}`}
          aria-label="Aurora Intelligence Supervisory Graph Topology"
        >
          {/* Top Metadata */}
          <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3 text-[10px] font-mono text-[#524F47]">
            <span className="uppercase tracking-widest font-semibold text-[#0D0D0D]">
              FIG 02.1 · AGENT DECISION TOPOLOGY
            </span>
            <span>DAG PROTOCOL · HUMAN VERIFICATION GATE</span>
          </div>

          {/* Center Schematic SVG */}
          <div className="my-auto w-full max-h-36 sm:max-h-48 flex items-center justify-center">
            <svg
              viewBox="0 0 500 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-[#0D0D0D]"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              {/* Directed Connecting Edges */}
              <line x1="85" y1="80" x2="160" y2="45" stroke="#BBB6AA" strokeWidth="1.5" />
              <line x1="85" y1="80" x2="160" y2="115" stroke="#BBB6AA" strokeWidth="1.5" />
              <line x1="240" y1="45" x2="310" y2="80" stroke="#BBB6AA" strokeWidth="1.5" />
              <line x1="240" y1="115" x2="310" y2="80" stroke="#BBB6AA" strokeWidth="1.5" />
              <line x1="390" y1="80" x2="445" y2="80" stroke="#0D0D0D" strokeWidth="2" />

              {/* Node 1: Input Ingestion */}
              <rect
                x="25"
                y="62"
                width="60"
                height="36"
                fill="#FFFFFF"
                stroke="#0D0D0D"
                strokeWidth="1.5"
              />
              <text
                x="35"
                y="84"
                fill="#0D0D0D"
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
                fill="#FFFFFF"
                stroke="#BBB6AA"
                strokeWidth="1.5"
              />
              <text x="172" y="49" fill="#0D0D0D" fontFamily="monospace" fontSize="8">
                CHAIN TREE
              </text>

              {/* Node 2B: Safety Boundary */}
              <rect
                x="160"
                y="97"
                width="80"
                height="36"
                fill="#FFFFFF"
                stroke="#BBB6AA"
                strokeWidth="1.5"
              />
              <text x="175" y="119" fill="#0D0D0D" fontFamily="monospace" fontSize="8">
                POLICY VAL
              </text>

              {/* Node 3: Human Verification Checkpoint */}
              <rect
                x="310"
                y="60"
                width="80"
                height="40"
                fill="#0D0D0D"
                stroke="#0D0D0D"
                strokeWidth="1.5"
              />
              <text
                x="320"
                y="81"
                fill="#D8FF45"
                fontFamily="monospace"
                fontSize="8"
                fontWeight="bold"
              >
                HUMAN GATE
              </text>
              <text x="330" y="92" fill="#FAF8F4" fontFamily="monospace" fontSize="7">
                APPROVAL
              </text>

              {/* Node 4: Sandbox Result */}
              <circle cx="460" cy="80" r="16" fill="#FFFFFF" stroke="#0D0D0D" strokeWidth="1.5" />
              <text
                x="452"
                y="83"
                fill="#0D0D0D"
                fontFamily="monospace"
                fontSize="8"
                fontWeight="bold"
              >
                EXEC
              </text>
            </svg>
          </div>

          {/* Bottom Token Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#D8D4CA] text-[9px] font-mono text-[#524F47]">
            <span>permission_boundary: STRICT_HUMAN_OVERSIGHT</span>
            <span className="bg-[#FAF8F4] px-1.5 py-0.5 border border-[#D8D4CA]">
              PROTOTYPE TOPOLOGY
            </span>
          </div>
        </div>
      );

    case 'strata-commerce':
      return (
        <div
          className={`relative w-full ${containerAspect} bg-[#EFECE3] border border-[#D8D4CA] overflow-hidden p-6 sm:p-8 flex flex-col justify-between transition-colors group-hover:bg-[#EAE6DC] ${className}`}
          aria-label="Strata Commerce Edge Routing Architecture"
        >
          {/* Top Metadata */}
          <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3 text-[10px] font-mono text-[#524F47]">
            <span className="uppercase tracking-widest font-semibold text-[#0D0D0D]">
              FIG 03.1 · EDGE ROUTING & CATALOGUE CACHE
            </span>
            <span>SSR EDGE · MULTI-CURRENCY BUS</span>
          </div>

          {/* Center Schematic SVG */}
          <div className="my-auto w-full max-h-36 sm:max-h-48 flex items-center justify-center">
            <svg
              viewBox="0 0 500 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-[#0D0D0D]"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              {/* Architecture Rings */}
              <circle
                cx="250"
                cy="80"
                r="70"
                stroke="#D8D4CA"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <circle cx="250" cy="80" r="45" stroke="#BBB6AA" strokeWidth="1" />

              {/* Center Edge Hub */}
              <rect
                x="215"
                y="62"
                width="70"
                height="36"
                fill="#0D0D0D"
                stroke="#0D0D0D"
                strokeWidth="1.5"
              />
              <text
                x="228"
                y="84"
                fill="#D8FF45"
                fontFamily="monospace"
                fontSize="9"
                fontWeight="bold"
              >
                EDGE HUB
              </text>

              {/* Edge Nodes */}
              {/* Node Left: Ingestion */}
              <rect
                x="40"
                y="64"
                width="75"
                height="32"
                fill="#FFFFFF"
                stroke="#0D0D0D"
                strokeWidth="1"
              />
              <text x="50" y="84" fill="#0D0D0D" fontFamily="monospace" fontSize="8">
                CATALOGUE
              </text>
              <line
                x1="115"
                y1="80"
                x2="205"
                y2="80"
                stroke="#0D0D0D"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />

              {/* Node Top: Pricing Router */}
              <rect
                x="212"
                y="10"
                width="75"
                height="28"
                fill="#FFFFFF"
                stroke="#0D0D0D"
                strokeWidth="1"
              />
              <text x="225" y="28" fill="#0D0D0D" fontFamily="monospace" fontSize="8">
                CURRENCY
              </text>
              <line x1="250" y1="38" x2="250" y2="62" stroke="#0D0D0D" strokeWidth="1.5" />

              {/* Node Right: Client Checkout */}
              <rect
                x="385"
                y="64"
                width="75"
                height="32"
                fill="#FFFFFF"
                stroke="#0D0D0D"
                strokeWidth="1"
              />
              <text x="398" y="84" fill="#0D0D0D" fontFamily="monospace" fontSize="8">
                CHECKOUT
              </text>
              <line x1="285" y1="80" x2="385" y2="80" stroke="#0D0D0D" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Bottom Token Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#D8D4CA] text-[9px] font-mono text-[#524F47]">
            <span>routing_topology: COMPOSED_CATALOGUE_EDGES</span>
            <span className="bg-[#FAF8F4] px-1.5 py-0.5 border border-[#D8D4CA]">
              REFERENCE ARCHITECTURE
            </span>
          </div>
        </div>
      );

    case 'vanguard-identity':
    default:
      return (
        <div
          className={`relative w-full ${containerAspect} bg-[#EFECE3] border border-[#D8D4CA] overflow-hidden p-6 sm:p-8 flex flex-col justify-between transition-colors group-hover:bg-[#EAE6DC] ${className}`}
          aria-label="Vanguard Visual Architecture Modular Elevation"
        >
          {/* Top Metadata */}
          <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3 text-[10px] font-mono text-[#524F47]">
            <span className="uppercase tracking-widest font-semibold text-[#0D0D0D]">
              FIG 04.1 · MODULAR ELEVATION & PROPORTIONAL GRID
            </span>
            <span>RATIO 1:1.618 · BASELINE 12pt (PROPORTIONAL STUDY)</span>
          </div>

          {/* Center Schematic SVG */}
          <div className="my-auto w-full max-h-36 sm:max-h-48 flex items-center justify-center">
            <svg
              viewBox="0 0 500 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-[#0D0D0D]"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              {/* Golden Ratio Nested Rectangles */}
              <rect x="50" y="20" width="220" height="120" stroke="#0D0D0D" strokeWidth="1.5" />
              <rect
                x="270"
                y="20"
                width="136"
                height="120"
                stroke="#BBB6AA"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <rect x="270" y="20" width="136" height="74" stroke="#BBB6AA" strokeWidth="1" />
              <rect x="354" y="94" width="52" height="46" stroke="#BBB6AA" strokeWidth="1" />

              {/* Architectural Elevation Line */}
              <line x1="30" y1="140" x2="470" y2="140" stroke="#0D0D0D" strokeWidth="2" />
              <line x1="50" y1="10" x2="50" y2="150" stroke="#D8D4CA" strokeWidth="1" />
              <line x1="406" y1="10" x2="406" y2="150" stroke="#D8D4CA" strokeWidth="1" />

              {/* Typographic Axis */}
              <text
                x="65"
                y="70"
                fill="#0D0D0D"
                fontFamily="serif"
                fontSize="22"
                fontStyle="italic"
              >
                Vanguard
              </text>
              <text
                x="65"
                y="90"
                fill="#524F47"
                fontFamily="monospace"
                fontSize="8"
                letterSpacing="0.2em"
              >
                SPATIAL PROPORTION
              </text>

              {/* Ratio Mark */}
              <circle cx="270" cy="20" r="3" fill="#D8FF45" stroke="#0D0D0D" strokeWidth="1" />
              <text x="280" y="16" fill="#524F47" fontFamily="monospace" fontSize="8">
                φ = 1.618
              </text>
            </svg>
          </div>

          {/* Bottom Token Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#D8D4CA] text-[9px] font-mono text-[#524F47]">
            <span>grid_system: MODULAR_GOLDEN_SECTION</span>
            <span className="bg-[#FAF8F4] px-1.5 py-0.5 border border-[#D8D4CA]">
              STUDIO EXPLORATION
            </span>
          </div>
        </div>
      );
  }
}
