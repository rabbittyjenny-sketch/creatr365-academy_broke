-- Live RLS on public.events only lets the creator (auth.uid() = created_by)
-- select/update/delete their own rows — there is no admin-wide policy (the
-- "Admins can view/update all events" policies from an earlier migration
-- never actually landed on this project). That's why the Event CMS could
-- only ever edit whichever event the current admin happened to have
-- created: any pre-existing event created by someone else, or seeded
-- directly in the DB, was invisible/unmanageable to every other admin.
--
-- Mirrors the existing "Admins manage articles" policy shape exactly, as
-- an additional permissive policy alongside the creator-scoped ones (so
-- non-admin creators keep managing their own events as before).
CREATE POLICY "Admins manage all events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
