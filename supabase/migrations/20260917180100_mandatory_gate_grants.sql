-- Supabase security advisor flagged has_passed_mandatory_gate/
-- issue_completion_record (20260917180000) as SECURITY DEFINER functions
-- callable by anon/authenticated with an arbitrary _user_id — any signed-in
-- caller could pass someone else's id and probe/issue a completion record
-- on their behalf.
--
-- Both are meant to be called server-side only, from the save-score edge
-- function (service role) right after it records a diagnostic attempt —
-- the client never calls them directly, it only ever reads
-- completion_records via the existing RLS SELECT policy. So the fix is at
-- the grant level, not the function signature: revoke from anon/
-- authenticated, grant to service_role only.

REVOKE ALL ON FUNCTION public.has_passed_mandatory_gate(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_passed_mandatory_gate(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.issue_completion_record(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_completion_record(uuid, uuid, uuid) TO service_role;
