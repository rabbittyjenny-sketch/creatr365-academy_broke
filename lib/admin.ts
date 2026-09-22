import { supabase } from '@/integrations/supabase/client';

/**
 * Check whether the given authenticated Supabase user has the existing
 * `admin` role in `public.user_roles` via the database's `has_role()` RPC.
 *
 * This intentionally reuses the project's existing role/RPC system instead
 * of introducing a second client-side admin-role implementation.
 */
export const isCurrentUserAdmin = async (userId: string): Promise<boolean> => {
  if (!userId) return false;

  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });

  if (error) {
    console.error('[admin] Failed to verify admin role:', error);
    return false;
  }

  return data === true;
};
