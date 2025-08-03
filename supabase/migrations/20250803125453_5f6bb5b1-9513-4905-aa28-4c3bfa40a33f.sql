-- Add student_id column to profiles table for student identification
ALTER TABLE public.profiles 
ADD COLUMN student_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_profiles_student_id ON public.profiles(student_id);

-- Update the handle_new_user function to handle student registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, role, student_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Admin'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    CASE 
      WHEN NEW.email = 'university@admin.com' THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    END,
    NEW.raw_user_meta_data->>'student_id'
  );
  RETURN NEW;
END;
$function$;