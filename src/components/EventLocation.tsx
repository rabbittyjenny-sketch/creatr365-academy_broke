import React from 'react';
import arrowRight from '@/assets/arrow-right.svg';

interface EventLocationProps {
  address: string;
  venueName?: string;
  /** Admin-pasted Google Maps share link; falls back to searching the address. */
  mapUrl?: string;
  isOnline?: boolean;
}

export const EventLocation: React.FC<EventLocationProps> = ({ address, venueName, mapUrl, isOnline }) => {
  const query = encodeURIComponent([venueName, address].filter(Boolean).join(' '));
  const directionsUrl = mapUrl || `https://maps.google.com/?q=${query}`;
  return (
    <section className="flex flex-col items-start gap-4 self-stretch relative">
      <div className="flex flex-col items-start gap-5 self-stretch relative">
        <hr className="h-px self-stretch relative bg-[#1A1A1A] border-0" />
        <h2 className="self-stretch text-[#1A1A1A] text-[11px] font-normal uppercase relative">
          LOCATION
        </h2>
      </div>
      {isOnline ? (
        <p className="text-[#1A1A1A] text-[17px] leading-[20.74px] tracking-[-0.34px]">
          ออนไลน์ — ลิงก์เข้าร่วมจะแสดงในหน้า "กิจกรรมของฉัน" หลังแอดมินยืนยันที่นั่ง
        </p>
      ) : (
        <>
          <div className="flex items-start gap-8 self-stretch relative max-sm:flex-col max-sm:gap-4">
            <address className="flex-1 text-[#1A1A1A] text-[17px] font-normal leading-[20.74px] tracking-[-0.34px] relative not-italic">
              {venueName && <span className="block font-medium">{venueName}</span>}
              {address}
            </address>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1A1A1A] text-[11px] font-normal uppercase relative bg-transparent cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-2 no-underline whitespace-nowrap"
            >
              <img src={arrowRight} alt="" className="w-2 h-2.5" />
              GET DIRECTIONS
            </a>
          </div>
          {query && (
            <iframe
              src={`https://www.google.com/maps?q=${query}&output=embed`}
              className="h-[214px] self-stretch relative w-full max-sm:h-[180px] border-0"
              loading="lazy"
              title="Event location map"
            />
          )}
        </>
      )}
    </section>
  );
};
