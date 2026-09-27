import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { SEOHead } from '@/components/SEOHead';
import { LINE_CONTACT_URL, REG_STATUS_TH, type RegistrationStatus } from '@/lib/events';

/**
 * Learners don't create events (admins do, in Admin → เนื้อหา). This page is
 * the learner's side of "request to join": each request's status, withdraw a
 * pending one, and — once an admin confirms the seat — the meeting link /
 * attendee info that is never shown on the public event page.
 */

interface MyEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  target_date: string;
  ends_at: string | null;
  background_image_url: string;
  location_type: string;
  venue_name: string;
  address: string;
  map_url: string;
}

interface Entry {
  status: RegistrationStatus;
  registered_at: string;
  event: MyEvent;
  privateInfo?: { online_url: string; attendee_info: string };
}

const STATUS_STYLE: Record<RegistrationStatus, string> = {
  requested: 'bg-[#FA76FF] text-black',
  confirmed: 'bg-[#34A853] text-black',
  rejected: 'bg-[#1A1A1A] text-white',
  cancelled: 'bg-white text-[#1A1A1A]/60',
};

const isPast = (e: MyEvent) => {
  const end = new Date(e.ends_at || e.target_date);
  return !isNaN(end.getTime()) && end < new Date();
};

const EventCard = ({ entry, onCancel }: { entry: Entry; onCancel: (eventId: string) => void }) => {
  const navigate = useNavigate();
  const { event, status, privateInfo } = entry;

  return (
    <div className="relative group flex flex-col">
      <button type="button" className="text-left cursor-pointer" onClick={() => navigate(`/event/${event.id}`)}>
        <div className="overflow-hidden mb-3">
          <div
            className="aspect-[4/3] bg-gray-300 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
            style={{ backgroundImage: `url(${event.background_image_url})` }}
          />
        </div>
        <div className="absolute top-4 left-4 flex flex-col gap-0">
          <div className="bg-white border border-black px-3 h-[23px] flex items-center">
            <div className="text-[11px] font-medium uppercase leading-none">{event.date}</div>
          </div>
          <div className="bg-white border border-t-0 border-black px-3 h-[23px] flex items-center">
            <div className="text-[11px] font-medium leading-none">{event.time}</div>
          </div>
        </div>
        <span className={`absolute top-4 right-4 border border-black px-3 h-[23px] flex items-center text-[11px] font-medium uppercase ${STATUS_STYLE[status]}`}>
          {REG_STATUS_TH[status]}
        </span>
        <h3 className="text-base font-medium">{event.title}</h3>
      </button>

      {status === 'requested' && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-[13px] text-[#1A1A1A]/70">รอแอดมินยืนยันทาง LINE</p>
          <div className="flex gap-2">
            <a href={LINE_CONTACT_URL} target="_blank" rel="noopener noreferrer"
              className="flex-1 h-[38px] flex items-center justify-center bg-[#06C755] text-white text-[11px] uppercase">
              ติดต่อแอดมิน LINE
            </a>
            <button onClick={() => onCancel(event.id)}
              className="flex-1 h-[38px] border border-[#1A1A1A] text-[11px] uppercase hover:bg-[#1A1A1A] hover:text-white transition-colors">
              ยกเลิกคำขอ
            </button>
          </div>
        </div>
      )}

      {status === 'confirmed' && (
        <div className="mt-3 border border-[#1A1A1A] p-3 flex flex-col gap-2 text-[13px]">
          {event.location_type === 'online' ? (
            privateInfo?.online_url
              ? <a href={privateInfo.online_url} target="_blank" rel="noopener noreferrer" className="underline break-all">เข้าร่วมออนไลน์: {privateInfo.online_url}</a>
              : <p className="text-[#1A1A1A]/70">แอดมินจะส่งลิงก์เข้าร่วมให้ก่อนเริ่มกิจกรรม</p>
          ) : (
            <p>
              {[event.venue_name, event.address].filter(Boolean).join(' · ') || 'สถานที่: ดูในหน้ากิจกรรม'}
              {(event.map_url || event.address) && (
                <a className="ml-2 underline" target="_blank" rel="noopener noreferrer"
                  href={event.map_url || `https://maps.google.com/?q=${encodeURIComponent([event.venue_name, event.address].filter(Boolean).join(' '))}`}>
                  แผนที่
                </a>
              )}
            </p>
          )}
          {privateInfo?.attendee_info && <p className="whitespace-pre-line text-[#1A1A1A]/80">{privateInfo.attendee_info}</p>}
          <p className="text-[#1A1A1A]/60">ต้องการยกเลิกหรือเปลี่ยนแปลง กรุณาติดต่อแอดมินทาง LINE</p>
        </div>
      )}
    </div>
  );
};

type Tab = 'upcoming' | 'history';

const MyEvents = () => {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [slideStyle, setSlideStyle] = useState({ width: 0, transform: 'translateX(0)' });
  const upcomingRef = useRef<HTMLButtonElement>(null);
  const historyRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/'); return; }
      setUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { navigate('/'); return; }
      setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchMyEvents = useCallback(async (u: User) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('event_registrations')
      .select('status, registered_at, events (id, title, date, time, target_date, ends_at, background_image_url, location_type, venue_name, address, map_url)')
      .eq('user_id', u.id)
      .order('registered_at', { ascending: false });
    if (error) {
      toast.error('โหลดกิจกรรมไม่สำเร็จ');
      setLoading(false);
      return;
    }
    const rows: Entry[] = (data || [])
      .filter(r => r.events)
      .map(r => ({ status: r.status as RegistrationStatus, registered_at: r.registered_at, event: r.events as unknown as MyEvent }));

    // Meeting link / attendee info: RLS only returns rows for events where
    // this learner's seat is confirmed.
    const confirmedIds = rows.filter(r => r.status === 'confirmed').map(r => r.event.id);
    if (confirmedIds.length) {
      const { data: priv } = await supabase
        .from('event_private_details')
        .select('event_id, online_url, attendee_info')
        .in('event_id', confirmedIds);
      for (const p of priv || []) {
        const row = rows.find(r => r.event.id === p.event_id);
        if (row) row.privateInfo = { online_url: p.online_url, attendee_info: p.attendee_info };
      }
    }
    setEntries(rows);
    setLoading(false);
  }, []);

  useEffect(() => { if (user) fetchMyEvents(user); }, [user, fetchMyEvents]);

  const upcoming = entries.filter(e => (e.status === 'requested' || e.status === 'confirmed') && !isPast(e.event));
  const history = entries.filter(e => !upcoming.includes(e));
  const displayed = activeTab === 'upcoming' ? upcoming : history;

  useEffect(() => {
    const update = () => {
      if (activeTab === 'upcoming' && upcomingRef.current) {
        setSlideStyle({ width: upcomingRef.current.offsetWidth, transform: 'translateX(0)' });
      } else if (activeTab === 'history' && historyRef.current && upcomingRef.current) {
        setSlideStyle({ width: historyRef.current.offsetWidth, transform: `translateX(${upcomingRef.current.offsetWidth}px)` });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [activeTab, upcoming.length, history.length]);

  const handleCancel = async (eventId: string) => {
    if (!window.confirm('ยกเลิกคำขอเข้าร่วมกิจกรรมนี้?')) return;
    const { error } = await supabase.rpc('cancel_event_registration', { _event_id: eventId });
    if (error) { toast.error(error.message); return; }
    toast.success('ยกเลิกคำขอแล้ว');
    if (user) fetchMyEvents(user);
  };

  return (
    <>
      <SEOHead
        title="My Events"
        description="กิจกรรมที่คุณขอเข้าร่วม และสถานะการยืนยัน"
      />
      <link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div className="min-h-screen bg-white">
        <Navbar />

        <div className="pt-32 pb-20 px-4 md:px-8">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-8">
              My Events
            </h1>

            <div className="relative flex gap-0 mb-12" role="tablist">
              <div
                className="absolute top-0 left-0 h-full bg-[#ff6bff] border border-black transition-all duration-300 ease-out pointer-events-none"
                style={{ width: `${slideStyle.width}px`, transform: slideStyle.transform }}
              />
              <button
                ref={upcomingRef}
                role="tab"
                aria-selected={activeTab === 'upcoming'}
                onClick={() => setActiveTab('upcoming')}
                className="relative z-10 px-6 py-3 text-[11px] font-medium uppercase text-black border border-black transition-colors max-sm:flex-1 bg-transparent"
              >
                กำลังจะมาถึง ({upcoming.length})
              </button>
              <button
                ref={historyRef}
                role="tab"
                aria-selected={activeTab === 'history'}
                onClick={() => setActiveTab('history')}
                className="relative z-10 px-6 py-3 text-[11px] font-medium uppercase text-black border border-l-0 border-black transition-colors max-sm:flex-1 bg-transparent"
              >
                ประวัติ ({history.length})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {loading ? (
                <div className="col-span-full text-center py-12">กำลังโหลด...</div>
              ) : displayed.length === 0 ? (
                <div className="col-span-full text-center py-12 flex flex-col items-center gap-4">
                  <p>{activeTab === 'upcoming' ? 'ยังไม่มีกิจกรรมที่ขอเข้าร่วม' : 'ยังไม่มีประวัติ'}</p>
                  {activeTab === 'upcoming' && (
                    <button onClick={() => navigate('/events')}
                      className="px-6 py-3 bg-[#1A1A1A] text-white border border-[#1A1A1A] hover:bg-white hover:text-[#1A1A1A] transition-colors uppercase text-sm font-medium">
                      ดูกิจกรรมทั้งหมด
                    </button>
                  )}
                </div>
              ) : (
                displayed.map(entry => (
                  <EventCard key={entry.event.id} entry={entry} onCancel={handleCancel} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyEvents;
