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
    hero: 'pt-24 pb-16 md:pt-36 md:pb-24 lg:pt-40 lg:pb-32',
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
      className={`inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase text-indigo-700 ${className}`}
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
    xl: 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[-0.035em] leading-[1.02]',
    lg: 'text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-[-0.03em] leading-[1.06]',
    md: 'text-2xl sm:text-4xl md:text-5xl tracking-[-0.025em] leading-[1.12]',
    sm: 'text-xl sm:text-2xl md:text-3xl tracking-[-0.02em] leading-[1.2]',
  }[size];

  const fontClass = serif ? 'font-serif' : 'font-sans font-bold';

  return (
    <Component className={`${fontClass} ${sizeClasses} text-slate-900 ${className}`} {...props}>
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
  const fontClass = serif ? 'font-serif' : 'font-sans font-bold';
  return (
    <Component
      className={`${fontClass} text-2xl sm:text-3xl md:text-4xl tracking-[-0.025em] leading-tight text-slate-900 ${className}`}
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
    lead: 'text-lg sm:text-xl md:text-2xl leading-relaxed text-slate-700',
    default: 'text-base sm:text-lg leading-relaxed text-slate-600',
    small: 'text-sm sm:text-base leading-normal text-slate-500',
  }[size];

  return (
    <Component className={`${sizeClasses} ${className}`} {...props}>
      {children}
    </Component>
  );
}

/**
 * Modern, tactile, high-conversion button primitive.
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
      'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-md hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 border border-slate-800',
    secondary:
      'bg-white text-slate-800 hover:bg-slate-50 hover:text-indigo-600 active:bg-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 border border-slate-200/80',
    accent:
      'bg-indigo-600 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-md hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 border border-indigo-500/30 font-medium',
    ghost:
      'bg-transparent text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 active:bg-indigo-100/70 border border-transparent',
    outline:
      'bg-transparent text-slate-900 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 border border-slate-300',
  }[variant];

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 rounded-lg',
    default: 'text-sm sm:text-base px-5 py-2.5 gap-2 rounded-xl font-medium',
    lg: 'text-base sm:text-lg px-7 py-3.5 gap-2.5 rounded-2xl font-medium',
  }[size];

  return (
    <button
      type={type}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center font-sans tracking-wide transition-all duration-200 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2 ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Category or status badge pill with modern refined accents.
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
    default: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    accent: 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold',
    dark: 'bg-slate-900 text-slate-100 border border-slate-800',
    outline: 'bg-white/80 text-slate-600 border border-slate-200',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 font-mono text-[10px] sm:text-xs tracking-wider uppercase rounded-full shadow-xs ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Clean subtle rule divider.
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
      className={`w-full border-0 ${strong ? 'border-t-2 border-slate-300' : 'border-t border-slate-200/80'} my-8 md:my-12 ${className}`}
      {...props}
    />
  );
}

/**
 * Elevated card container with crisp border and subtle ambient tactile depth.
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
      className={`relative bg-white/90 backdrop-blur-xs border border-slate-200/80 rounded-2xl p-6 sm:p-8 md:p-10 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] transition-all duration-300 ${hover ? 'hover:-translate-y-1 hover:shadow-[0_20px_35px_-10px_rgba(79,70,229,0.08)] hover:border-indigo-300/80' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
