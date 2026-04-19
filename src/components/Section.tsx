import React from 'react';
import { colorMap } from '@/data/courseData';

interface SectionProps {
  color: 'blue' | 'yellow' | 'red' | 'green' | 'black';
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export const Section: React.FC<SectionProps> = ({ color, title, subtitle, children, className = '', dark = false }) => {
  const colors = colorMap[color];
  
  return (
    <section className={`py-20 md:py-28 px-4 ${dark ? `${colors.bg} text-white` : `${colors.bgLight} text-foreground`} ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 md:mb-16">
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium tracking-widest uppercase mb-4 ${dark ? 'bg-white/20 text-white' : `${colors.bg} ${color === 'yellow' ? 'text-foreground' : 'text-white'}`}`}>
            {subtitle || title}
          </div>
          <h2 className={`text-3xl md:text-5xl font-bold tracking-tight ${dark ? 'text-white' : 'text-foreground'}`}>
            {title}
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
};
