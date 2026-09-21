import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CalendarIcon, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import arrowDown from '@/assets/arrow-down.png';
import { SEOHead } from '@/components/SEOHead';
import { EventsCarousel } from '@/components/EventsCarousel';
import { RotatingBadge } from '@/components/RotatingBadge';

// Same wayfinding accent Explore.tsx already uses for its Events tile —
// reused here so the listing page reads as the same destination, not a
// bolted-on separate design.
const EVENTS_ACCENT = '#C0567A';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  background_image_url: string;
  target_date: string;
  address: string;
}

const EventCard = ({
  event
}: {
  event: Event;
}) => {
  const navigate = useNavigate();
  
  const isEventLive = () => {
    const now = new Date().getTime();
    const target = new Date(event.target_date).getTime();
    const oneHour = 1000 * 60 * 60;
    return now >= target && now <= target + oneHour;
  };
  
  const eventLive = isEventLive();

  return (
    <div
      className="sharp-card section-accent group cursor-pointer border border-border bg-card overflow-hidden h-full flex flex-col"
      style={{ '--hover-accent': EVENTS_ACCENT, '--section-accent': EVENTS_ACCENT } as React.CSSProperties}
      onClick={() => navigate(`/event/${event.id}`)}
    >
      <div className="relative overflow-hidden border-b border-border">
        <div
          className="aspect-square bg-gray-300 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
          style={{ backgroundImage: `url(${event.background_image_url})` }}
        ></div>
        <div className="absolute top-4 left-4 flex flex-col gap-0">
          <div className="bg-white border border-black px-3 h-[23px] flex items-center">
            <div className="text-[11px] font-medium uppercase leading-none">{event.date}</div>
          </div>
          <div className="bg-white border border-t-0 border-black px-3 h-[23px] flex items-center">
            <div className="text-[11px] font-medium leading-none">{event.time}</div>
          </div>
          {eventLive && (
            <div className="bg-[#CC0033] border border-t-0 border-black px-3 h-[23px] flex items-center">
              <div className="text-[11px] font-bold uppercase leading-none text-white">LIVE NOW</div>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-bold leading-tight mb-1.5">{event.title}</h3>
        <p className="text-muted-foreground text-sm flex-1">{event.address}</p>
        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
          <span
            className="text-xs font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all"
            style={{ color: EVENTS_ACCENT }}
          >
            ดูรายละเอียด
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
const Discover = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCountry, setUserCountry] = useState<string>('the world');
  const [initialDateSet, setInitialDateSet] = useState(false);

  useEffect(() => {
    fetchEvents();
    detectUserCountry();
  }, []);

  // Set initial date only if there are events today
  useEffect(() => {
    if (!initialDateSet && events.length > 0) {
      const today = new Date();
      const now = today.getTime();
      const oneHour = 1000 * 60 * 60;
      
      const hasEventsToday = events.some((event) => {
        const eventDate = new Date(event.target_date);
        const target = eventDate.getTime();
        const hasEnded = target < now - oneHour;
        
        if (hasEnded) return false;
        
        return (
          eventDate.getFullYear() === today.getFullYear() &&
          eventDate.getMonth() === today.getMonth() &&
          eventDate.getDate() === today.getDate()
        );
      });
      
      if (hasEventsToday) {
        setDate(today);
      }
      setInitialDateSet(true);
    }
  }, [events, initialDateSet]);

  const detectUserCountry = async () => {
    try {
      const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
      const data = await response.text();
      const locMatch = data.match(/loc=([A-Z]{2})/);
      
      if (locMatch && locMatch[1]) {
        const countryCode = locMatch[1];
        // Convert country code to full name
        const countryNames: { [key: string]: string } = {
          'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada', 'AU': 'Australia',
          'DE': 'Germany', 'FR': 'France', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands',
          'BE': 'Belgium', 'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland',
          'PL': 'Poland', 'CH': 'Switzerland', 'AT': 'Austria', 'IE': 'Ireland', 'PT': 'Portugal',
          'IN': 'India', 'JP': 'Japan', 'CN': 'China', 'KR': 'South Korea', 'BR': 'Brazil',
          'MX': 'Mexico', 'AR': 'Argentina', 'CL': 'Chile', 'CO': 'Colombia', 'SG': 'Singapore',
          'NZ': 'New Zealand', 'ZA': 'South Africa', 'RU': 'Russia', 'TR': 'Turkey', 'GR': 'Greece'
        };
        setUserCountry(countryNames[countryCode] || countryCode);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error detecting country:', error);
      setUserCountry('the world');
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, time, background_image_url, target_date, address')
        .order('target_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on selected date and hide ended events
  const filteredEvents = events.filter((event) => {
    // Check if event has ended (more than 1 hour past target_date)
    const now = new Date().getTime();
    const target = new Date(event.target_date).getTime();
    const oneHour = 1000 * 60 * 60;
    const hasEnded = target < now - oneHour;
    
    if (hasEnded) return false;
    
    if (!date) return true;
    
    const eventDate = new Date(event.target_date);
    const selectedDate = new Date(date);
    
    return (
      eventDate.getFullYear() === selectedDate.getFullYear() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getDate() === selectedDate.getDate()
    );
  });
  const scrollToEvents = () => {
    const eventsSection = document.getElementById('events-section');
    eventsSection?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return <div className="min-h-screen bg-white">
      <SEOHead 
        title="กิจกรรมและเวิร์กช็อป - Creatr365"
        description="ดูเวิร์กช็อปและกิจกรรมของ Creatr365 ที่กำลังเปิดรับสมัคร ค้นหาตามวันที่ที่คุณสะดวก"
        keywords="กิจกรรม, เวิร์กช็อป, Creatr365, live commerce event"
      />
      <div className="animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <Navbar />
      </div>
      
      {/* Decorative rotating badge - fixed to viewport */}
      <RotatingBadge 
        text="BROWSE" 
        onClick={scrollToEvents}
        showIcon={true}
        icon={<img src={arrowDown} alt="Arrow down" className="w-6 h-6 md:w-7 md:h-7 lg:w-12 lg:h-12" />}
      />
      
      {/* Hero Section */}
      <section className="pt-32 md:pt-40 lg:pt-48 pb-6 md:pb-16 lg:pb-24 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium mb-6 md:mb-10 inline-flex flex-col items-center" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <div className="flex items-center">
              <span className="border border-black px-3 md:px-6 py-2 md:py-4 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>ค้นหา</span>
              <span className="text-white border border-black px-3 md:px-6 py-2 md:py-4 -ml-px animate-fade-in" style={{ background: EVENTS_ACCENT, animationDelay: '0.4s', animationFillMode: 'both' }}>กิจกรรม</span>
            </div>
            <div className="flex items-center -mt-px">
              <span className="border border-black px-3 md:px-6 py-2 md:py-4 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>ของ</span>
              <span className="border border-l-0 border-black px-3 md:px-6 py-2 md:py-4 animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>Creatr365</span>
            </div>
          </h1>
          <p className="text-sm md:text-base lg:text-[18px] text-black max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
            เวิร์กช็อปและกิจกรรมสดที่กำลังเปิดรับสมัคร — เลือกดูตามวันที่ที่คุณสะดวก
          </p>
        </div>
      </section>

      {/* Auto-scrolling Events Carousel */}
      <EventsCarousel />

      {/* Events Section */}
      <section id="events-section" className="px-4 md:px-8 pb-16 pt-6 md:pt-16">
        <div>
          <div className="flex flex-wrap items-center gap-0 mb-6 md:mb-8 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
            <h2 className="text-base md:text-lg lg:text-xl font-normal w-full sm:w-auto mb-2 sm:mb-0">กำลังดูกิจกรรมใน</h2>
            <span className="text-base md:text-lg lg:text-xl font-normal border border-black px-2 py-1 sm:ml-2">{userCountry}</span>
            
            {/* Calendar button for mobile/tablet */}
            <div className="lg:hidden">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "text-base md:text-lg lg:text-xl font-normal border border-l-0 border-black px-2 py-1 flex items-center bg-white hover:bg-gray-50 transition-colors",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "d MMM yyyy") : <span>เลือกวันที่</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={date} 
                    onSelect={setDate} 
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-12 mt-8 md:mt-16">
            {/* Calendar - Desktop only */}
            <div className="hidden lg:block animate-fade-in lg:sticky lg:top-24 self-start" style={{ animationDelay: '0.9s', animationFillMode: 'both' }}>
              <Calendar mode="single" selected={date} onSelect={setDate} className="mx-auto" />
            </div>

            {/* Event Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:col-start-2 gap-5">
              {loading ? (
                <div className="col-span-full text-center py-12">กำลังโหลดกิจกรรม...</div>
              ) : filteredEvents.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  {date ? `ไม่พบกิจกรรมในวันที่ ${date.toLocaleDateString('th-TH', { weekday: 'long', month: 'long', day: 'numeric' })}` : 'ยังไม่มีกิจกรรมในขณะนี้ — กลับมาดูใหม่เร็ว ๆ นี้'}
                </div>
              ) : (
                filteredEvents.map((event, index) => (
                  <div 
                    key={event.id} 
                    className="animate-fade-in" 
                    style={{ animationDelay: `${1.0 + (index * 0.1)}s`, animationFillMode: 'both' }}
                  >
                    <EventCard event={event} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>;
};
export default Discover;
