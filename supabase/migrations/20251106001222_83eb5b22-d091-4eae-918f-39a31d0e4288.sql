-- Update RLS policies on attendance_records to use security definer function
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Admins can delete attendance" ON public.attendance_records;

CREATE POLICY "Admins can view all attendance"
ON public.attendance_records
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete attendance"
ON public.attendance_records
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));