-- Toolbox free-file downloads need their own license-acceptance record,
-- separate from resource_download_logs.consented (which covers paid-course
-- materials + refund-forfeiture wording). Same additive pattern as
-- 20260915100000_resource_download_audit.sql: add a `consented` column to
-- the existing insert-only log instead of a new table, and add the
-- matching "view own rows" policy so the client can check whether a user
-- already accepted the license for a given asset (needed so
-- ToolboxDownloadConsentDialog only has to be shown once per asset, not on
-- every repeat download).

ALTER TABLE public.toolbox_downloads
  ADD COLUMN IF NOT EXISTS consented boolean NOT NULL DEFAULT true;

-- Students can read their own toolbox download rows (mirrors "Users can
-- view their own download logs" on resource_download_logs). Previously
-- toolbox_downloads only had an admin-only SELECT policy + a self INSERT
-- policy, so the client had no way to know it had already logged consent
-- for an asset.
DROP POLICY IF EXISTS "Users can view their own toolbox downloads" ON public.toolbox_downloads;
CREATE POLICY "Users can view their own toolbox downloads"
ON public.toolbox_downloads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
