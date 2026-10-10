import React, { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';

/**
 * Baseline shell component preserved for backwards compatibility.
 */
export function Shell({
  children,
  className = '',
}: Readonly<{ children: ReactNode; className?: string }>) {
  return <div className={`zavlio-shell ${className}`}>{children}</div>;
}

/**
 * Editorial max-width layout container with responsive fluid padding.
 */
export function Container({
  children,
  className = '',
  size = 'default',
  ...props
}: Readonly<
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
    className?: string;
    size?: 'default' | 'narrow' | 'wide' | 'full';
  }
>) {
  const sizeClasses = {
    narrow: 'max-w-4xl',
    default: 'max-w-7xl',
    wide: 'max-w-[1440px]',
    full: 'max-w-none',
  }[size];

  return (
    <div
      className={`mx-auto w-full px-5 sm:px-8 md:px-12 lg:px-16 ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Semantic section with rhythmic vertical breathing room.
 */
export function Section({
  children,
  className = '',
  spacing = 'default',
  id,
  ...props
}: Readonly<
  HTMLAttributes<HTMLElement> & {
    children: ReactNode;
    className?: string;
    spacing?: 'compact' | 'default' | 'spacious' | 'hero';
    id?: string;
  }
>) {
  const spacingClasses = {
    compact: 'py-12 md:py-16',
    default: 'py-16 md:py-24 lg:py-32',
    spacious: 'py-24 md:py-36 lg:py-48',
    hero: 'pt-24 pb-16 md:pt-36 md:pb-24 lg:pt-44 lg:pb-32',
  }[spacing];

  return (
    <section id={id} className={`relative w-full ${spacingClasses} ${className}`} {...props}>
      {children}
    </section>
  );
}

/**
 * Small uppercase technical label / tracking badge for editorial categories and metadata.
 */
export function Eyebrow({
  children,
  className = '',
  as: Component = 'span',
  ...props
}: Readonly<
  HTMLAttributes<HTMLElement> & {
    children: ReactNode;
    className?: string;
    as?: 'span' | 'p' | 'div';
  }
>) {
  return (
    <Component
      className={`inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-medium tracking-[0.18em] uppercase text-[#646059] ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Large expressive headline for heroes, section titles, and narrative punctuation.
 */
export function DisplayHeading({
  children,
  className = '',
  as: Component = 'h2',
  size = 'md',
  serif = false,
  ...props
}: Readonly<
  HTMLAttributes<HTMLHeadingElement> & {
    children: ReactNode;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
    size?: 'xl' | 'lg' | 'md' | 'sm';
    serif?: boolean;
  }
>) {
  const sizeClasses = {
    xl: 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[-0.035em] leading-[0.98]',
    lg: 'text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-[-0.03em] leading-[1.04]',
    md: 'text-2xl sm:text-4xl md:text-5xl tracking-[-0.025em] leading-[1.12]',
    sm: 'text-xl sm:text-2xl md:text-3xl tracking-[-0.02em] leading-[1.2]',
  }[size];

  const fontClass = serif ? 'font-serif' : 'font-sans font-medium';

  return (
    <Component className={`${fontClass} ${sizeClasses} text-[#0D0D0D] ${className}`} {...props}>
      {children}
    </Component>
  );
}

/**
 * Section subheadings and narrative block titles.
 */
export function SectionHeading({
  children,
  className = '',
  as: Component = 'h2',
  serif = false,
  ...props
}: Readonly<
  HTMLAttributes<HTMLHeadingElement> & {
    children: ReactNode;
    className?: string;
    as?: 'h2' | 'h3' | 'h4';
    serif?: boolean;
  }
>) {
  const fontClass = serif ? 'font-serif' : 'font-sans font-medium';
  return (
    <Component
      className={`${fontClass} text-2xl sm:text-3xl md:text-4xl tracking-[-0.02em] leading-tight text-[#0D0D0D] ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Editorial paragraph copy with measured character width and line-height.
 */
export function BodyCopy({
  children,
  className = '',
  size = 'default',
  as: Component = 'p',
  ...props
}: Readonly<
  HTMLAttributes<HTMLParagraphElement> & {
    children: ReactNode;
    className?: string;
    size?: 'lead' | 'default' | 'small';
    as?: 'p' | 'div' | 'span';
  }
>) {
  const sizeClasses = {
    lead: 'text-lg sm:text-xl md:text-2xl leading-relaxed text-[#171717]',
    default: 'text-base sm:text-lg leading-relaxed text-[#383530]',
    small: 'text-sm sm:text-base leading-normal text-[#646059]',
  }[size];

  return (
    <Component className={`${sizeClasses} ${className}`} {...props}>
      {children}
    </Component>
  );
}

/**
 * Tactile, sharp button primitive adhering to the Zavlio warm-ivory design language.
 */
export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'default',
  type = 'button',
  disabled = false,
  ...props
}: Readonly<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
    size?: 'sm' | 'default' | 'lg';
  }
>) {
  const variantClasses = {
    primary:
      'bg-[#0D0D0D] text-[#FAF8F4] hover:bg-[#262626] active:bg-[#000000] border border-[#0D0D0D]',
    secondary:
      'bg-[#FAF8F4] text-[#0D0D0D] hover:bg-[#F0EDE4] active:bg-[#E5E0D5] border border-[#D8D4CA]',
    accent:
      'bg-[#D8FF45] text-[#0D0D0D] hover:bg-[#C9F335] active:bg-[#BDE726] border border-[#C5EB34] font-semibold',
    ghost:
      'bg-transparent text-[#0D0D0D] hover:bg-[#EAE6DC]/60 active:bg-[#EAE6DC] border border-transparent',
    outline:
      'bg-transparent text-[#0D0D0D] hover:bg-[#FAF8F4] active:bg-[#F0EDE4] border border-[#0D0D0D]',
  }[variant];

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    default: 'text-sm sm:text-base px-5 py-2.5 gap-2',
    lg: 'text-base sm:text-lg px-7 py-3.5 gap-2.5',
  }[size];

  return (
    <button
      type={type}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center font-sans tracking-wide transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#0D0D0D] focus-visible:outline-offset-2 ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Category or status badge pill.
 */
export function Badge({
  children,
  className = '',
  variant = 'default',
  ...props
}: Readonly<
  HTMLAttributes<HTMLSpanElement> & {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'accent' | 'dark' | 'outline';
  }
>) {
  const variantClasses = {
    default: 'bg-[#EAE6DC] text-[#383530] border border-[#D8D4CA]',
    accent: 'bg-[#D8FF45] text-[#0D0D0D] border border-[#C5EB34] font-semibold',
    dark: 'bg-[#0D0D0D] text-[#FAF8F4] border border-[#0D0D0D]',
    outline: 'bg-transparent text-[#646059] border border-[#D8D4CA]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 font-mono text-[10px] sm:text-xs tracking-wider uppercase ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Clean 1px rule divider honoring the warm parchment color system.
 */
export function Divider({
  className = '',
  strong = false,
  ...props
}: Readonly<
  HTMLAttributes<HTMLHRElement> & {
    className?: string;
    strong?: boolean;
  }
>) {
  return (
    <hr
      className={`w-full border-0 ${strong ? 'border-t-2 border-[#BBB6AA]' : 'border-t border-[#D8D4CA]'} my-8 md:my-12 ${className}`}
      {...props}
    />
  );
}

/**
 * Elevated card container with crisp border and subtle tactile depth.
 */
export function Card({
  children,
  className = '',
  hover = true,
  ...props
}: Readonly<
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
    className?: string;
    hover?: boolean;
  }
>) {
  return (
    <div
      className={`relative bg-[#FAF8F4] border border-[#D8D4CA] p-6 sm:p-8 md:p-10 transition-all duration-200 ${hover ? 'hover:border-[#BBB6AA] hover:bg-[#FFFFFF]' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
