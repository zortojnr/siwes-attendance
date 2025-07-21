-- First, let's create the admin user account
-- We'll insert directly into auth.users and profiles

-- Insert the admin user into auth.users (this requires special permissions)
-- Since we can't directly insert into auth.users, we'll create a function to handle admin signup

-- Create a function to register the admin user
CREATE OR REPLACE FUNCTION public.create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert admin profile directly (we'll handle the auth user creation through the app)
  INSERT INTO public.profiles (user_id, first_name, last_name, role)
  SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Admin',
    'User', 
    'admin'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin' AND first_name = 'Admin'
  );
END;
$$;

-- Call the function
SELECT public.create_admin_user();