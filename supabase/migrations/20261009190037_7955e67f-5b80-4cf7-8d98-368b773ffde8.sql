ALTER TABLE public.utility_service_requests
  ADD COLUMN IF NOT EXISTS availability_unit text,
  ADD COLUMN IF NOT EXISTS availability_value integer,
  ADD COLUMN IF NOT EXISTS cancelled_by text;

CREATE OR REPLACE FUNCTION public.validate_utility_availability()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.availability_unit IS NOT NULL AND NEW.availability_unit NOT IN ('minutes','days') THEN
    RAISE EXCEPTION 'Invalid availability unit';
  END IF;
  IF NEW.availability_value IS NOT NULL AND (NEW.availability_value < 1 OR NEW.availability_value > 10000) THEN
    RAISE EXCEPTION 'Invalid availability value';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS validate_utility_availability ON public.utility_service_requests;
CREATE TRIGGER validate_utility_availability BEFORE INSERT OR UPDATE ON public.utility_service_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_utility_availability();

CREATE OR REPLACE FUNCTION public.cancel_my_utility_request(_request_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  UPDATE public.utility_service_requests
     SET status = 'cancelled', cancelled_by = 'customer', updated_at = now()
   WHERE id = _request_id AND customer_user_id = auth.uid()
     AND status IN ('pending','assigned','quoted');
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END $$;
REVOKE ALL ON FUNCTION public.cancel_my_utility_request(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cancel_my_utility_request(uuid) TO authenticated;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.utility_service_requests;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;