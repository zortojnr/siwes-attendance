/*
  # Initial SIWES Attendance System Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `first_name` (text)
      - `last_name` (text)
      - `student_id` (text, optional for students)
      - `role` (text, default 'student')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (enum: admin, student, guest)
      - `created_at` (timestamptz)
    
    - `attendance_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `student_name` (text)
      - `date` (date)
      - `time` (time)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `location_name` (text)
      - `created_at` (timestamptz)
    
    - `siwes_locations`
      - `id` (uuid, primary key)
      - `student_name` (text)
      - `location` (text)
      - `assigned_by` (text)
      - `assigned_date` (date)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Admin users can manage all records
    - Students can view/update their own records
    - Guest users have limited read access
*/

-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('admin', 'student', 'guest');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  first_name text,
  last_name text,
  student_id text,
  role text DEFAULT 'student',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'student',
  created_at timestamptz DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  student_name text NOT NULL,
  date date DEFAULT CURRENT_DATE,
  time time DEFAULT CURRENT_TIME,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  location_name text,
  created_at timestamptz DEFAULT now()
);

-- Create siwes_locations table
CREATE TABLE IF NOT EXISTS siwes_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  location text NOT NULL,
  assigned_by text,
  assigned_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE siwes_locations ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (has_role('admin', auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (has_role('admin', auth.uid()))
  WITH CHECK (has_role('admin', auth.uid()));

-- User roles policies
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (has_role('admin', auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin', auth.uid()));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (has_role('admin', auth.uid()))
  WITH CHECK (has_role('admin', auth.uid()));

CREATE POLICY "System can insert roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Attendance records policies
CREATE POLICY "Users can view own attendance"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (has_role('admin', auth.uid()));

CREATE POLICY "Admins can manage all attendance"
  ON attendance_records FOR ALL
  TO authenticated
  USING (has_role('admin', auth.uid()))
  WITH CHECK (has_role('admin', auth.uid()));

-- SIWES locations policies
CREATE POLICY "Users can view all locations"
  ON siwes_locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage locations"
  ON siwes_locations FOR ALL
  TO authenticated
  USING (has_role('admin', auth.uid()))
  WITH CHECK (has_role('admin', auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_siwes_locations_student ON siwes_locations(student_name);
