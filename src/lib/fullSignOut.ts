import { supabase } from '@/integrations/supabase/client';

export async function fullSignOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) {
    console.error('fullSignOut failed:', error.message);
  }
}
