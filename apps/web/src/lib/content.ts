export interface ProjectItem {
  slug: string;
  title: string;
  client: string;
  type: string;
  year: string;
  disciplines: string[];
  summary: string;
  challenge: string;
  approach: string;
  outcome: string;
  tag: 'STUDIO_CASE' | 'REFERENCE_IMPLEMENTATION' | 'PROTOTYPE_SYSTEM' | 'CONCEPT_ARCHITECTURE';
  featured: boolean;
}

export interface ServiceItem {
  slug: 'strategy' | 'design' | 'technology' | 'growth';
  title: string;
  tagline: string;
  description: string;
  capabilities: { title: string; detail: string }[];
  process: { step: string; title: string; description: string }[];
  deliverables: string[];
}

export interface LabItem {
  slug: string;
  title: string;
  category: string;
  status: 'ACTIVE_PROTOTYPE' | 'RESEARCH_NOTE' | 'TECHNICAL_EXPERIMENT';
  description: string;
  hypothesis: string;
  findings: string;
  stack: string[];
}

export interface InsightItem {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  content: { heading: string; paragraphs: string[] }[];
}

export const PROJECTS: ProjectItem[] = [
  {
    slug: 'kinetiq-systems',
    title: 'Kinetiq Systems',
    client: 'Internal Studio Study',
    type: 'Design System & Motion Architecture',
    year: '2026',
    disciplines: ['Design Systems', 'Motion Engineering', 'Frontend Architecture'],
    summary:
      'A modular component language exploring token-based layout architecture, mathematical motion curves, and semantic keyboard accessibility.',
    challenge:
      'Modern web interfaces frequently suffer from disconnected animations, bloated third-party motion libraries, and poor mobile performance.',
    approach:
      'Designed a deterministic token-based layout and animation layer respecting user motion preferences with low main-thread overhead.',
    outcome:
      'Established a modular component foundation for complex web products, eliminating layout shift and maintaining predictable rendering.',
    tag: 'CONCEPT_ARCHITECTURE',
    featured: true,
  },
  {
    slug: 'aurora-intelligence',
    title: 'Aurora Intelligence',
    client: 'Internal AI Research Study',
    type: 'AI Platform Interface & Agent Canvas',
    year: '2026',
    disciplines: ['AI System Design', 'Product Architecture', 'Full-Stack Engineering'],
    summary:
      'An exploratory operator workspace for supervising autonomous agent clusters, evaluating reasoning traces, and approving critical multi-step decisions.',
    challenge:
      'Complex multi-agent AI platforms overwhelm human reviewers with opaque log streams and fragmented telemetry.',
    approach:
      'Designed an editorial canvas with progressive disclosure, human-in-the-loop verification gates, and clear state visualization.',
    outcome:
      'Demonstrated clear supervisory visibility with strict permission boundaries and zero accidental automated side effects in prototype testing.',
    tag: 'PROTOTYPE_SYSTEM',
    featured: true,
  },
  {
    slug: 'strata-commerce',
    title: 'Strata Commerce',
    client: 'Digital Commerce Reference Study',
    type: 'Headless Digital Commerce',
    year: '2025',
    disciplines: ['E-Commerce Strategy', 'Design', 'Edge Engineering'],
    summary:
      'A performance-first headless commerce reference architecture exploring composable catalogue routing, dynamic currency switching, and editorial merchandising.',
    challenge:
      'Traditional storefront templates force a trade-off between expressive editorial storytelling and checkout conversion velocity.',
    approach:
      'Constructed a composable commerce exploration with server-rendered catalogue edges, client navigation transitions, and localized inventory awareness.',
    outcome:
      'Demonstrated streamlined page delivery and responsive transitions for high-density product catalogues without visual compromise.',
    tag: 'REFERENCE_IMPLEMENTATION',
    featured: true,
  },
  {
    slug: 'vanguard-identity',
    title: 'Vanguard Visual Architecture',
    client: 'Spatial Practice Exploration',
    type: 'Brand Identity & Web Presence',
    year: '2025',
    disciplines: ['Brand Strategy', 'Visual Identity', 'Web Development'],
    summary:
      'A restrained visual identity and digital experience exploration for an avant-garde architectural and spatial design studio.',
    challenge:
      'Expressing physical materiality, spatial scale, and structural restraint through digital browser viewports.',
    approach:
      'Used warm parchment textures, rigorous geometric grids, and high-contrast editorial typography to reflect architectural honesty.',
    outcome:
      'A clean, memorable concept study letting architectural space and structural imagery breathe without decorative chrome.',
    tag: 'STUDIO_CASE',
    featured: true,
  },
];

export const SERVICES: ServiceItem[] = [
  {
    slug: 'strategy',
    title: 'Strategy',
    tagline: 'Clarity before execution.',
    description:
      'We define the market positioning, product architecture, and digital roadmaps that help companies navigate complexity and build enduring value.',
    capabilities: [
      {
        title: 'Brand Positioning & Narrative',
        detail:
          'Articulating unique value propositions that resonate across markets and stakeholders.',
      },
      {
        title: 'Product Architecture & Scoping',
        detail: 'Transforming ambitious visions into modular, phased technical blueprints.',
      },
      {
        title: 'Digital Ecosystem Strategy',
        detail:
          'Connecting platforms, touchpoints, and operational data into unified business engines.',
      },
      {
        title: 'Growth & Monetization Models',
        detail:
          'Designing sustainable acquisition, pricing, and retention funnels backed by first-party insight.',
      },
    ],
    process: [
      {
        step: '01',
        title: 'Discovery & Investigation',
        description: 'Deep qualitative audit and market context mapping.',
      },
      {
        step: '02',
        title: 'Synthesis & Positioning',
        description: 'Crystallizing narrative pillars and strategic priorities.',
      },
      {
        step: '03',
        title: 'Architecture & Roadmapping',
        description: 'Defining milestones, system requirements, and resource plans.',
      },
    ],
    deliverables: [
      'Strategic Blueprint',
      'Brand Manifesto',
      'Technical Architecture Spec',
      'Execution Roadmap',
    ],
  },
  {
    slug: 'design',
    title: 'Design',
    tagline: 'Craft that commands attention.',
    description:
      'We craft identity systems, digital products, and editorial web experiences that balance striking aesthetic distinction with effortless usability.',
    capabilities: [
      {
        title: 'Visual Identity & Design Systems',
        detail:
          'Comprehensive brand systems, typography guidelines, and scalable design token architectures.',
      },
      {
        title: 'Digital Product Design (UI/UX)',
        detail:
          'Intuitive user workflows, high-density professional software interfaces, and mobile experiences.',
      },
      {
        title: 'Editorial Web Experiences',
        detail: 'Narrative-driven websites that communicate corporate pedigree, vision, and depth.',
      },
      {
        title: 'Motion & Spatial Direction',
        detail:
          'Intentional micro-interactions and visual choreography that reinforce user understanding.',
      },
    ],
    process: [
      {
        step: '01',
        title: 'Visual Explorations',
        description: 'Art direction, moodboards, and core typographic directions.',
      },
      {
        step: '02',
        title: 'Interactive Prototyping',
        description: 'Testing layouts, responsive behaviors, and micro-motions.',
      },
      {
        step: '03',
        title: 'Design System Delivery',
        description: 'Publishing production-ready component tokens and assets.',
      },
    ],
    deliverables: [
      'Identity System Assets',
      'Figma Design System',
      'Responsive UI Kit',
      'Motion Specifications',
    ],
  },
  {
    slug: 'technology',
    title: 'Technology',
    tagline: 'Engineering built to endure.',
    description:
      'We build high-performance web platforms, custom software products, autonomous automation systems, and enterprise data integrations.',
    capabilities: [
      {
        title: 'Full-Stack Web Platforms',
        detail:
          'Server-rendered, accessible web applications leveraging modern TypeScript, Next.js, and edge networks.',
      },
      {
        title: 'AI Systems & Agent Workflows',
        detail:
          'Orchestrating autonomous agents with strict policy boundaries, human approvals, and deterministic fallbacks.',
      },
      {
        title: 'Robust API & Data Architectures',
        detail:
          'Relational data models, event ingestion pipelines, and resilient server-to-server protocols.',
      },
      {
        title: 'Performance & Security Engineering',
        detail:
          'Core Web Vitals optimization, automated release gates, end-to-end testing, and secret protection.',
      },
    ],
    process: [
      {
        step: '01',
        title: 'System Blueprinting',
        description: 'Defining schema, contracts, boundaries, and security models.',
      },
      {
        step: '02',
        title: 'Test-Driven Implementation',
        description: 'Building feature packages with unit, integration, and E2E coverage.',
      },
      {
        step: '03',
        title: 'Hardening & Deployment',
        description: 'Verifying release gates, zero-drift migrations, and monitoring.',
      },
    ],
    deliverables: [
      'Production Web Application',
      'Database Migrations',
      'Automated Test Suites',
      'Deployment CI/CD Pipeline',
    ],
  },
  {
    slug: 'growth',
    title: 'Growth',
    tagline: 'Compound impact through systems.',
    description:
      'We design first-party analytics architectures, technical SEO foundations, conversion engines, and automation pipelines that drive sustainable growth.',
    capabilities: [
      {
        title: 'First-Party Analytics & Attribution',
        detail:
          'Privacy-first event instrumentation without third-party tracking cookies or data leakage.',
      },
      {
        title: 'Conversion Funnel Optimization',
        detail:
          'High-intent lead intake workflows with automated validation and CRM synchronization.',
      },
      {
        title: 'Technical SEO & Content Strategy',
        detail:
          'Structured data markup, semantic content hierarchy, and lightning-fast page delivery.',
      },
      {
        title: 'Lifecycle & Workflow Automation',
        detail:
          'Connecting lead signals to sales task SLAs, notification outboxes, and customer lifecycle states.',
      },
    ],
    process: [
      {
        step: '01',
        title: 'Measurement Audit',
        description: 'Mapping user journeys, attribution touchpoints, and baseline funnels.',
      },
      {
        step: '02',
        title: 'Instrumentation & Tuning',
        description: 'Deploying first-party tracking, intake optimizations, and automated alerts.',
      },
      {
        step: '03',
        title: 'Iterative Experimentation',
        description: 'Evaluating empirical conversion evidence and refining user flows.',
      },
    ],
    deliverables: [
      'Analytics Taxonomy',
      'Optimized Intake Funnels',
      'Attribution Reports',
      'Lifecycle Automation Playbooks',
    ],
  },
];

export const LAB_EXPERIMENTS: LabItem[] = [
  {
    slug: 'spatial-kinematics',
    title: 'Spatial Kinematics',
    category: 'Motion & Canvas',
    status: 'ACTIVE_PROTOTYPE',
    description:
      'Exploring mathematical parametric wave surfaces rendered via lightweight HTML5 2D Canvas isometric trigonometry, with off-screen pause observers and reduced-motion support.',
    hypothesis:
      'Can dynamic spatial atmosphere be integrated into editorial websites without degrading mobile battery life or Core Web Vitals?',
    findings:
      'By pausing off-screen contexts, clamping device pixel ratios, and defaulting to static wireframes under reduced-motion, interactive mathematical surfaces run with minimal overhead.',
    stack: ['HTML5 2D Canvas', 'Parametric Trigonometry', 'IntersectionObserver', 'TypeScript'],
  },
  {
    slug: 'agent-reasoning-graphs',
    title: 'Agent Reasoning Graphs',
    category: 'Autonomous AI',
    status: 'ACTIVE_PROTOTYPE',
    description:
      'Visualizing decision trees and policy validation checkpoints for multi-agent workflows executing in isolated sandboxes.',
    hypothesis:
      'Human-in-the-loop oversight requires transparent topological visualizations rather than tabular log dumps.',
    findings:
      'Topological state representation provides transparent operator traceability for multi-stage agent validation traces.',
    stack: ['TypeScript', 'DAG Topologies', 'Event Streams', 'Reactive Canvas'],
  },
  {
    slug: 'container-micro-typography',
    title: 'Container-Query Micro-Typography',
    category: 'Design Systems',
    status: 'TECHNICAL_EXPERIMENT',
    description:
      'A responsive typography system where font weight, optical tracking, and line height adjust fluidly based on parent container width rather than global viewport size.',
    hypothesis:
      'Modular editorial components require intrinsic typographic responsiveness to look pristine inside split-column cards and nested dialogs.',
    findings:
      'CSS container units (`cqi`, `cqw`) provide vastly superior typographic harmony compared to standard viewport media queries.',
    stack: ['CSS Container Queries', 'Modern Web APIs', 'Fluid Clamps'],
  },
];

export const INSIGHTS: InsightItem[] = [
  {
    slug: 'systems-over-frameworks',
    title: 'Systems Over Frameworks: Why Enduring Digital Products Outlive Transient Trends',
    category: 'Architecture',
    date: 'OCT 2026',
    readTime: '6 min read',
    excerpt:
      'How focusing on relational data models, clear boundary contracts, and first-principles design creates software that remains fast, maintainable, and adaptable.',
    content: [
      {
        heading: 'The Allure of the New',
        paragraphs: [
          'In modern digital engineering, tools and JavaScript frameworks cycle at dizzying speeds. Teams often rewrite entire codebases every three years chasing minor ergonomic improvements, only to find the same fundamental architectural problems waiting for them on the other side.',
          'At Zavlio, we believe true durability comes from investing in systems rather than frameworks. A well-designed relational data model outlasts any frontend rendering library. A rigorously specified API protocol survives across multiple UI iterations.',
        ],
      },
      {
        heading: 'Clear Boundaries Enable Continuous Evolution',
        paragraphs: [
          'When business logic, security permissions, and operational storage are decoupled from presentational components, the presentation layer can be completely redesigned without endangering customer data or introducing regressions.',
          'By isolating execution boundaries and establishing strict test contracts, digital companies achieve velocity without sacrificing stability.',
        ],
      },
    ],
  },
  {
    slug: 'restrained-motion-architecture',
    title: 'The Art of Restraint: Motion as Information, Not Noise',
    category: 'Design & Motion',
    date: 'SEP 2026',
    readTime: '5 min read',
    excerpt:
      'Why contemporary web design must reject gratuitous visual spectacle in favor of purposeful choreography that clarifies hierarchy and rewards user attention.',
    content: [
      {
        heading: 'Motion as Hierarchy',
        paragraphs: [
          'Animation on the web has reached an inflection point. The proliferation of template animation libraries has produced thousands of websites where every card rotates, floats, and pulses simultaneously. Instead of guiding the eye, this visual chaos exhausts the user.',
          'Intentional motion must possess purpose. It should signal cause and effect, demonstrate state transitions, and create spatial continuity between views. If an animation does not improve understanding, it should be removed.',
        ],
      },
      {
        heading: 'Performance and Accessibility as Core Constraints',
        paragraphs: [
          'True craft respects the physical device and the human using it. Animations must honor reduced-motion preferences immediately without breaking layouts. They must never block interactive clicks or delay content consumption.',
        ],
      },
    ],
  },
  {
    slug: 'first-party-analytics-sovereignty',
    title: 'First-Party Analytics & Data Sovereignty: Building Trust Without Surveillance',
    category: 'Privacy & Growth',
    date: 'AUG 2026',
    readTime: '7 min read',
    excerpt:
      'How modern digital businesses can derive actionable attribution and funnel insights while respecting user privacy and complying with international regulations.',
    content: [
      {
        heading: 'The Sunset of Third-Party Surveillance',
        paragraphs: [
          'For over a decade, digital growth was anchored to third-party tracking pixels that silently harvested consumer telemetry across millions of websites. Regulatory scrutiny, ad-blocker adoption, and browser security constraints have fundamentally dismantled this paradigm.',
          'Forward-thinking companies are recognizing that privacy is not a compliance obstacle—it is a competitive advantage. Direct first-party relationships built on consent provide cleaner, more reliable business intelligence than opaque third-party black boxes.',
        ],
      },
      {
        heading: 'Engineering Consent-Aware Instrumentation',
        paragraphs: [
          'A first-party analytics layer must enforce consent at the browser boundary. Essential features must remain completely accessible without analytics opt-in. When users choose to participate, event payloads should collect only safe categorical telemetry—never personal information or unhashed credentials.',
        ],
      },
    ],
  },
];
