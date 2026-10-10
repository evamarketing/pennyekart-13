ALTER TABLE public.utility_service_categories ADD COLUMN IF NOT EXISTS auto_cancel_minutes integer;

CREATE OR REPLACE FUNCTION public.auto_cancel_stale_utility_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  UPDATE public.utility_service_requests r
  SET status = 'cancelled',
      cancelled_by = 'system',
      admin_notes = COALESCE(r.admin_notes, '') || E'\nAuto-cancelled: no partner accepted within the waiting limit.',
      updated_at = now()
  FROM public.utility_services s
  JOIN public.utility_service_categories c ON c.id = s.category_id
  WHERE r.service_id = s.id
    AND r.status = 'pending'
    AND c.auto_cancel_minutes IS NOT NULL
    AND c.auto_cancel_minutes > 0
    AND r.created_at < now() - make_interval(mins => c.auto_cancel_minutes);
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_cancel_stale_utility_requests() TO authenticated;