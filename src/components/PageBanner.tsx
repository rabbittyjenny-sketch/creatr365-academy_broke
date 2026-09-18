import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PageBannerRow {
  image_url: string | null;
  video_url: string | null;
}

/**
 * Optional header image/video for the otherwise text-only Explore sub-pages
 * (Toolbox / AI Lab / Creator Tools). Renders nothing until an admin sets
 * one in Admin → Explore Banners — these pages look exactly as they do
 * today until then, no placeholder image invented to fill the space.
 */
export const PageBanner: React.FC<{ pageKey: string; accent: string }> = ({ pageKey, accent }) => {
  const [banner, setBanner] = useState<PageBannerRow | null>(null);

  useEffect(() => {
    supabase
      .from('page_banners')
      .select('image_url,video_url')
      .eq('page_key', pageKey)
      .maybeSingle()
      .then(({ data }) => setBanner(data));
  }, [pageKey]);

  if (!banner || (!banner.image_url && !banner.video_url)) return null;

  return (
    <div
      className="sharp-tile relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden mb-8 border border-border border-t-4"
      style={{ borderTopColor: accent }}
    >
      {banner.video_url ? (
        <video
          src={banner.video_url}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <img src={banner.image_url ?? undefined} alt="" className="w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" aria-hidden="true" />
    </div>
  );
};
