import React from 'react';
import { colorMap } from '@/data/courseData';

interface RevealCardProps {
  color: 'blue' | 'yellow' | 'red' | 'green' | 'black';
  children: React.ReactNode;
  revealContent: React.ReactNode;
  className?: string;
}

export const RevealCard: React.FC<RevealCardProps> = ({ color, children, revealContent, className = '' }) => {
  const colors = colorMap[color];
  
  return (
    <div className={`reveal-slide group rounded-2xl border border-border bg-card cursor-pointer transition-all duration-500 hover:shadow-2xl hover:border-transparent ${className}`}>
      <div className="relative z-10 p-6 transition-transform duration-500 group-hover:-translate-y-2">
        {children}
      </div>
      <div className={`reveal-content ${colors.bg} text-white rounded-b-2xl p-6 z-20`}>
        {revealContent}
      </div>
      <div className={`reveal-overlay ${colors.bg}/5 rounded-2xl pointer-events-none`} />
    </div>
  );
};
