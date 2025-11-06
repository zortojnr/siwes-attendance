-- Update RLS policies on siwes_locations to use security definer function
DROP POLICY IF EXISTS "Admins can insert locations" ON public.siwes_locations;

CREATE POLICY "Admins can insert locations"
ON public.siwes_locations
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));