import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from './Navbar';
import { EventCountdown } from './EventCountdown';
import { EventMeta } from './EventMeta';
import { EventHeader } from './EventHeader';
import { EventDescription } from './EventDescription';
import { EventLocation } from './EventLocation';
import { EventRegistration } from './EventRegistration';
import { AuthSheet } from './AuthSheet';
import { SEOHead } from './SEOHead';
import { EventTicketInfo } from './EventTicketInfo';
import { registrationWindow, type EventTimingAndPrice } from '@/lib/events';
interface Event extends EventTimingAndPrice {
  id: string;
  title: string;
  creator: string;
  description: string;
  date: string;
  time: string;
  address: string;
  background_image_url: string;
  target_date: string;
  location_type: string;
  venue_name: string;
  map_url: string;
  price_note: string;
}
export const EventDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(0);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  useEffect(() => {
    fetchEvent();
  }, [id]);
  
  const fetchEvent = async () => {
    const { data, error } = id
      ? await supabase.from('events').select('*').eq('id', id).eq('is_published', true).maybeSingle()
      : await supabase.from('events').select('*').eq('is_published', true).limit(1).maybeSingle();
    
    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching event:', error);
      setNotFound(true);
    } else if (!data) {
      setNotFound(true);
    } else {
      setEvent(data as Event);
      fetchConfirmed(data.id);
    }
    setLoading(false);
  };

  // Seats taken = admin-confirmed requests (count only; who registered is private).
  const fetchConfirmed = async (eventId: string) => {
    const { data } = await supabase.rpc('event_confirmed_counts', { _event_ids: [eventId] });
    setConfirmed(data?.[0]?.confirmed ?? 0);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-[#1A1A1A] text-2xl">Loading...</div>
      </div>;
  }
  if (notFound || !event) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-white px-4">
        <SEOHead 
          title="Event Not Found"
          description="The event you're looking for doesn't exist or has been removed."
        />
        <Navbar />
        <div className="text-center mt-20">
          <h1 className="text-4xl font-medium mb-4 text-[#1A1A1A]">Event Not Found</h1>
          <p className="text-lg text-[#1A1A1A] opacity-70 mb-8">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/events')}
            className="px-6 py-3 bg-[#1A1A1A] text-white border border-[#1A1A1A] hover:bg-white hover:text-[#1A1A1A] transition-colors uppercase text-sm font-medium"
          >
            Browse Events
          </button>
        </div>
      </div>
    );
  }
  return <>
      <SEOHead 
        title={event.title}
        description={event.description.substring(0, 160)}
        image={event.background_image_url}
        keywords={`event, ${event.title}, ${event.address}, community event`}
      />
      <link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Navbar />

      <main className="flex h-screen justify-center items-start w-full relative bg-white mx-auto my-0 max-lg:flex-col max-lg:h-auto">
        <div className="flex flex-col justify-end items-start fixed h-screen w-[calc(100%-540px)] pl-[49px] pr-[590px] pt-[calc(100vh-97px)] pb-12 left-0 top-0 overflow-hidden max-lg:relative max-lg:w-full max-lg:h-[400px] max-lg:bg-cover max-lg:bg-center max-lg:pt-80 max-lg:pb-6 max-lg:px-4 max-lg:right-0 max-sm:h-[300px] max-sm:pt-60 max-sm:pb-6 max-sm:px-4" role="img" aria-label="Event background image">
          <div className="absolute inset-0 animate-[zoom-in_1.2s_ease-out_forwards]" style={{
            backgroundImage: `url("${event.background_image_url}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}></div>
          <div className="relative z-10 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
            <EventCountdown targetDate={new Date(event.target_date)} />
          </div>
        </div>
        
        <aside className="flex w-[540px] flex-col justify-start items-start fixed h-screen box-border right-0 top-0 bg-white overflow-y-auto max-lg:relative max-lg:w-full max-lg:h-auto max-lg:right-auto max-lg:top-0 max-lg:overflow-y-visible">
          <div className="flex w-full flex-col items-start gap-10 relative p-10 pb-56 max-lg:w-full max-lg:px-4 max-lg:py-6 max-lg:pb-6 max-lg:gap-8 animate-fade-in [animation-delay:200ms]">
            <div className="flex flex-col items-start gap-4 self-stretch relative">
              <EventMeta date={event.date} time={event.time} />
              <EventHeader title={event.title} creator={event.creator} />
            </div>
            
            <EventDescription description={event.description} />
            
            <EventTicketInfo event={event} confirmed={confirmed} />

            <EventLocation
              address={event.address}
              venueName={event.venue_name}
              mapUrl={event.map_url}
              isOnline={event.location_type === 'online'}
            />
          </div>
          
          <div className="fixed bottom-0 right-0 w-[540px] bg-white py-6 border-t border-border max-lg:relative max-lg:w-full max-lg:py-6 max-lg:border-t-0">
            <div className="px-10 max-lg:px-4">
            <EventRegistration
              eventId={event.id}
              eventTitle={event.title}
              eventDate={[event.date, event.time].filter(Boolean).join(' ')}
              window={registrationWindow(event, confirmed)}
              onChanged={() => fetchConfirmed(event.id)}
              onAuthRequired={() => setIsAuthOpen(true)}
              className="animate-fade-in [animation-delay:400ms]"
            />
            </div>
          </div>
        </aside>
      </main>
      <AuthSheet isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>;
};