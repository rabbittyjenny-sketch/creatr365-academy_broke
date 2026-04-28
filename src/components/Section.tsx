import React from 'react';

interface SectionProps {
  color?: 'blue' | 'yellow' | 'red' | 'green' | 'black';
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

/**
 * Monochrome Section.
 * - dark=false: white background, black text, light grey badge
 * - dark=true: black background, white text, white/10 badge
 * Brand colors are reserved for hover states only (handled by .hover-shift utility).
 */
export const Section: React.FC<SectionProps> = ({ title, subtitle, children, className = '', dark = false }) => {
  return (
    <section className={`py-20 md:py-28 px-4 ${dark ? 'bg-foreground text-background' : 'bg-background text-foreground'} ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 md:mb-16">
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium tracking-widest uppercase mb-4 ${dark ? 'bg-background/10 text-background' : 'bg-foreground/5 text-foreground/70'}`}>
            {subtitle || title}
          </div>
          <h2 className={`text-3xl md:text-5xl font-bold tracking-tight ${dark ? 'text-background' : 'text-foreground'}`}>
            {title}
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
};
