import React, { useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { parseYouTubeId, youTubeThumb } from '@/lib/youtube';
import { accentVars, type Accent } from '@/lib/accentPalette';
import { ArrowLeft, ArrowRight, Play } from 'lucide-react';

export interface ClipCardItem {
  id: string;
  title: string;
  summary?: string | null;
  cover_image_url?: string | null;
  video_url: string | null;
  duration_label?: string | null;
  /** Small muted line under the summary (e.g. related course). */
  footnote?: string | null;
}

interface Props<T extends ClipCardItem> {
  items: T[];
  /** Color of each card (Live Notes rotate System B; Community uses one). */
  accentFor: (index: number) => Accent;
  onOpen: (item: T) => void;
  ctaLabel: string;
  /** Heading block shown left of the prev/next buttons. */
  header: React.ReactNode;
  /**
   * Full-width section: header stays in the page container while the row
   * bleeds to the right screen edge (last card cut off = "this scrolls").
   * Off: everything stays inside the parent container.
   */
  bleed?: boolean;
  loading?: boolean;
}

/**
 * Horizontal row of clip cards (sharp-card system: square, hard shadow on
 * hover), used by Live Notes on /courses and คลิปกิจกรรม on /articles so the
 * two stay identical. Each card is its own `section-accent` region, so its
 * hover text, heading underline and top line all use that card's color.
 */
export function ClipCarousel<T extends ClipCardItem>({ items, accentFor, onOpen, ctaLabel, header, bleed = false, loading = false }: Props<T>) {
  const [api, setApi] = useState<CarouselApi>();
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (!api) return;
    const sync = () => { setCanPrev(api.canScrollPrev()); setCanNext(api.canScrollNext()); };
    sync();
    api.on('select', sync);
    api.on('reInit', sync);
    return () => { api.off('select', sync); api.off('reInit', sync); };
  }, [api]);

  const basis = bleed
    ? 'basis-[80%] sm:basis-[44%] lg:basis-[30%] xl:basis-[27%]'
    : 'basis-[85%] sm:basis-[48%] lg:basis-[32%]';

  const nav = (
    <div className="hidden sm:flex gap-2 shrink-0">
      <button onClick={() => api?.scrollPrev()} disabled={!canPrev} aria-label="คลิปก่อนหน้า"
        className="sharp-btn w-10 h-10 grid place-items-center border border-border disabled:opacity-30">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      </button>
      <button onClick={() => api?.scrollNext()} disabled={!canNext} aria-label="คลิปถัดไป"
        className="sharp-btn w-10 h-10 grid place-items-center border border-border disabled:opacity-30">
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );

  const row = loading ? (
    <div className="flex gap-4 overflow-hidden py-3">
      {[0, 1, 2, 3].map(i => <div key={i} className="shrink-0 w-[80%] sm:w-[44%] lg:w-[30%] aspect-[16/10] bg-muted animate-pulse" />)}
    </div>
  ) : (
    <Carousel setApi={setApi} opts={{ align: 'start', containScroll: 'trimSnaps', dragFree: true }}>
      {/* py-3: room for the sharp-card lift + hard shadow inside the clipped viewport */}
      <CarouselContent className="pr-4 py-3">
        {items.map((item, i) => {
          const a = accentFor(i);
          const vid = parseYouTubeId(item.video_url);
          return (
            <CarouselItem key={item.id} className={basis}>
              <button
                onClick={() => onOpen(item)}
                className="group sharp-card sharp-tile section-accent flex flex-col w-full h-full text-left border border-border border-t-4 bg-card overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ ...accentVars(a), borderTopColor: a.fill, outlineColor: a.text }}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  {(item.cover_image_url || vid) && (
                    <img src={item.cover_image_url || youTubeThumb(vid!)} alt="" loading="lazy" className="w-full h-full object-cover" />
                  )}
                  <span className="absolute left-3 bottom-3 w-10 h-10 grid place-items-center" style={{ background: a.fill, color: a.on }}>
                    <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                  </span>
                  {item.duration_label && (
                    <span className="absolute right-3 bottom-3 text-[11px] font-semibold px-2 py-1 bg-black/70 text-white">{item.duration_label}</span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-base leading-snug line-clamp-2">{item.title}</h3>
                  {item.summary && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.summary}</p>}
                  {item.footnote && <p className="mt-2 text-[11px] text-muted-foreground">{item.footnote}</p>}
                  <p className="mt-auto pt-3 text-xs font-semibold" style={{ color: a.text }}>{ctaLabel}</p>
                </div>
              </button>
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );

  const headerRow = (
    <div className="mb-3 flex items-end justify-between gap-6">
      <div className="min-w-0">{header}</div>
      {!loading && items.length > 1 && nav}
    </div>
  );

  return bleed ? (
    <>
      <div className="max-w-6xl mx-auto px-4">{headerRow}</div>
      <div style={{ paddingLeft: 'max(1rem, calc((100vw - 72rem) / 2 + 1rem))' }}>{row}</div>
    </>
  ) : (
    <>
      {headerRow}
      {row}
    </>
  );
}
