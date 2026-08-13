import { supabase } from '@/integrations/supabase/client';

export async function isCurrentUserAdmin(userId: string) {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });

  if (error) {
    console.error('[admin] has_role failed', error);
    return false;
  }

  return data === true;
}
