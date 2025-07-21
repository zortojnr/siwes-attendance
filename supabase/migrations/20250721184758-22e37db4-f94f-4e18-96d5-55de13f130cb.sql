-- Insert admin profile (this will be triggered automatically when admin signs up)
-- The admin user will need to be created through the auth signup process first

-- Update the handle_new_user function to properly handle admin roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Admin'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    CASE 
      WHEN NEW.email = 'univerity@admin.com' THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    END
  );
  RETURN NEW;
END;
$function$;