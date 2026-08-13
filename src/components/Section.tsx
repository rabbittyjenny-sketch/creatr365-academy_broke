import React from 'react';

type SectionAccent = 'blue' | 'red' | 'yellow' | 'green';

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  accent?: SectionAccent;
}

/**
 * Monochrome Section.
 * - dark=false: white background, black text
 * - dark=true: black background, white text
 * `accent` sets the hover color for ALL h1-h6 + .hover-shift / .card-water inside.
 * Layout is fixed: H2 first, small subtitle BELOW it (consistent across the site).
 */
export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  children,
  className = '',
  dark = false,
  accent = 'blue',
}) => {
  return (
    <section
      data-accent={accent}
      className={`section-accent py-20 md:py-28 px-4 ${dark ? 'bg-foreground text-background' : 'bg-background text-foreground'} ${className}`}
    >
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 md:mb-16">
          <h2 className={`text-3xl md:text-5xl font-bold tracking-tight ${dark ? 'text-background' : 'text-foreground'}`}>
            {title}
          </h2>
          {subtitle && (
            <p className={`mt-3 text-base md:text-lg ${dark ? 'text-background/70' : 'text-muted-foreground'}`}>
              {subtitle}
            </p>
          )}
        </header>
        {children}
      </div>
    </section>
  );
};
