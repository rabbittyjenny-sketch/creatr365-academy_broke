import React, { useState } from 'react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check } from 'lucide-react';

const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID as string | undefined;

/**
 * Copies the promo link for one Live Note. `src` tags which platform the
 * viewer came from; it is saved with each view (content_views.source) and
 * shown in the statistics panel.
 */
const PLATFORMS: { src: string | null; label: string }[] = [
  { src: null, label: 'ลิงก์เว็บ (ไม่ระบุแหล่งที่มา)' },
  { src: 'tiktok', label: 'TikTok' },
  { src: 'facebook', label: 'Facebook' },
  { src: 'instagram', label: 'Instagram' },
  { src: 'youtube', label: 'YouTube' },
  { src: 'line', label: 'LINE (เปิดในเบราว์เซอร์)' },
];

export const LiveNoteLinkMenu: React.FC<{ slug: string; disabled?: boolean; children: React.ReactNode }> = ({ slug, disabled, children }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const webLink = (src: string | null) => {
    const q = new URLSearchParams({ note: slug });
    if (src) q.set('src', src);
    return `${window.location.origin}/courses?${q.toString()}`;
  };
  // Opens inside the LINE app and signs the viewer in with LINE automatically.
  // Requires the LIFF app's Endpoint URL to be the site root.
  const liffLink = LIFF_ID ? `https://liff.line.me/${LIFF_ID}/courses?note=${encodeURIComponent(slug)}&src=line_app` : null;

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt('คัดลอกลิงก์นี้', text);
    }
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        title={disabled ? 'เผยแพร่ก่อนจึงจะใช้ลิงก์ได้' : 'คัดลอกลิงก์โปรโมท'}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors disabled:opacity-30"
      >
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-none">
        <DropdownMenuLabel className="text-xs">คัดลอกลิงก์สำหรับโพสต์บน</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PLATFORMS.map(p => {
          const key = p.src ?? 'web';
          return (
            <DropdownMenuItem key={key} onSelect={e => { e.preventDefault(); copy(key, webLink(p.src)); }} className="text-xs justify-between">
              {p.label}
              {copied === key && <Check className="w-3.5 h-3.5 text-[#34A853]" aria-label="คัดลอกแล้ว" />}
            </DropdownMenuItem>
          );
        })}
        {liffLink && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={e => { e.preventDefault(); copy('liff', liffLink); }} className="text-xs justify-between">
              LINE OA (เปิดในแอป LINE + ล็อกอินอัตโนมัติ)
              {copied === 'liff' && <Check className="w-3.5 h-3.5 text-[#34A853]" aria-label="คัดลอกแล้ว" />}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
