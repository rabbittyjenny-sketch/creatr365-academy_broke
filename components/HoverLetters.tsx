import React from 'react';

type Accent = 'blue' | 'red' | 'yellow' | 'green';

interface Props {
  text: string;
  accent?: Accent;
  className?: string;
  /** Visual style: 'color' = each letter changes color, 'underline' = underline sweeps per letter, 'highlight' = bg highlight per letter */
  variant?: 'color' | 'underline' | 'highlight';
}

/**
 * Splits text into per-letter spans so each character animates
 * independently as the cursor passes across it.
 */
export const HoverLetters: React.FC<Props> = ({ text, accent = 'blue', className = '', variant = 'color' }) => {
  const cls =
    variant === 'underline' ? 'hover-letters hover-letters--underline' :
    variant === 'highlight' ? 'hover-letters hover-letters--highlight' :
    'hover-letters';
  return (
    <span className={`${cls} ${className}`} data-accent={accent}>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="hl-char" aria-hidden={ch === ' ' ? 'true' : undefined}>
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
      <span className="sr-only">{text}</span>
    </span>
  );
};

export default HoverLetters;
