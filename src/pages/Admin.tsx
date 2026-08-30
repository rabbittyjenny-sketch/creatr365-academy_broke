import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { SEOHead } from '@/components/SEOHead';
import { isCurrentUserAdmin } from '@/lib/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';

// Input validation schema
const eventSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  creator: z.string()
    .trim()
    .min(1, 'Creator is required')
    .max(100, 'Creator must be less than 100 characters'),
  description: z.string()
    .trim()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  date: z.string()
    .trim()
    .min(1, 'Date is required')
    .max(50, 'Date must be less than 50 characters'),
  time: z.string()
    .trim()
    .min(1, 'Time is required')
    .max(50, 'Time must be less than 50 characters'),
  address: z.string()
    .trim()
    .min(1, 'Address is required')
    .max(300, 'Address must be less than 300 characters'),
  target_date: z.string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Invalid date format'),
});

interface Event {
  id: string;
  title: string;
  creator: string;
  description: string;
  date: string;
  time: string;
  address: string;
  background_image_url: string;
  target_date: string;
}

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.documentElement.classList.add('dark');
    checkAuth();
    return () => document.documentElement.classList.remove('dark');
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth?redirect=/admin');
      return;
    }
    const allowed = await isCurrentUserAdmin(session.user.id);
    if (!allowed) { navigate('/'); return; }
    setIsAdmin(true);
    setLoading(false);
    fetchEvents();
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*');

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setEvents(data || []);
      if (data && data.length > 0) {
        setSelectedEvent(data[0]);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedEvent) return;
    
    const file = e.target.files[0];
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, GIF, or WebP image',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      // Organize uploads by user_id as required by storage policies
      const fileName = `${session.user.id}/${selectedEvent.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      setSelectedEvent({ ...selectedEvent, background_image_url: publicUrl });
      
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    // Convert datetime-local string to ISO timestamp
    const targetDateISO = selectedEvent.target_date.includes('T') 
      ? new Date(selectedEvent.target_date).toISOString()
      : selectedEvent.target_date;

    // Validate event data
    try {
      eventSchema.parse({
        title: selectedEvent.title,
        creator: selectedEvent.creator,
        description: selectedEvent.description,
        date: selectedEvent.date,
        time: selectedEvent.time,
        address: selectedEvent.address,
        target_date: targetDateISO,
      });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: validationError.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    const { error } = await supabase
      .from('events')
      .update({
        title: selectedEvent.title.trim(),
        creator: selectedEvent.creator.trim(),
        description: selectedEvent.description.trim(),
        date: selectedEvent.date.trim(),
        time: selectedEvent.time.trim(),
        address: selectedEvent.address.trim(),
        background_image_url: selectedEvent.background_image_url,
        target_date: targetDateISO,
      })
      .eq('id', selectedEvent.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Event updated successfully',
      });
      fetchEvents();
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" /></div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout title="Event CMS" onSignOut={handleSignOut}>
      <SEOHead
        title="Admin Dashboard"
        description="Manage events and content for your event platform"
      />
      {selectedEvent && (
        <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
          <div>
            <label className="text-xs text-white/40 font-medium block mb-1.5 uppercase tracking-wider">
              Event Title
            </label>
            <Input
              value={selectedEvent.title}
              onChange={(e) =>
                setSelectedEvent({ ...selectedEvent, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs text-white/40 font-medium block mb-1.5 uppercase tracking-wider">
              Creator
            </label>
            <Input
              value={selectedEvent.creator}
              onChange={(e) =>
                setSelectedEvent({ ...selectedEvent, creator: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs text-white/40 font-medium block mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <Textarea
              value={selectedEvent.description}
              onChange={(e) =>
                setSelectedEvent({ ...selectedEvent, description: e.target.value })
              }
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 font-medium block mb-1.5 uppercase tracking-wider">
                Date
              </label>
              <Input
                value={selectedEvent.date}
                onChange={(e) =>
                  setSelectedEvent({ ...selectedEvent, date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-xs text-white/40 font-medium block mb-1.5 uppercase tracking-wider">
                Time
              </label>
              <Input
                value={selectedEvent.time}
                onChange={(e) =>
                  setSelectedEvent({ ...selectedEvent, time: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 font-medium block mb-1.5 uppercase tracking-wider">
              Address
            </label>
            <Input
              value={selectedEvent.address}
              onChange={(e) =>
                setSelectedEvent({ ...selectedEvent, address: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs text-white/40 font-medium block mb-1.5 uppercase tracking-wider">
              Background Image
            </label>
            {selectedEvent.background_image_url && (
              <img
                src={selectedEvent.background_image_url}
                alt="Current background"
                className="w-full h-32 object-cover mb-2 rounded-lg border border-white/10"
              />
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-white/40 mt-1">Uploading...</p>}
          </div>

          <div>
            <label className="text-xs text-white/40 font-medium block mb-1.5 uppercase tracking-wider">
              Target Date (YYYY-MM-DD HH:MM:SS)
            </label>
            <Input
              type="datetime-local"
              value={selectedEvent.target_date.slice(0, 16)}
              onChange={(e) =>
                setSelectedEvent({ ...selectedEvent, target_date: e.target.value })
              }
            />
          </div>

          <Button type="submit" className="w-full bg-[#D4A843] text-black hover:opacity-90">
            Save Changes
          </Button>
        </form>
      )}
    </AdminLayout>
  );
};

export default Admin;
