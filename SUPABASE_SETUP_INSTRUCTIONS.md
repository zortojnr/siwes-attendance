# Supabase Setup Instructions

## Changes Made

### 1. Updated Supabase Client Configuration
- Updated `/src/integrations/supabase/client.ts` to use the correct Supabase project credentials
- Project URL: `https://mgofqsxdgpooqxpqitlf.supabase.co`
- Anon Key: Matches the key in `.env` file

### 2. Fixed Student ID Format
- Changed student ID validation from `FCP/CSS/20/XXXX` to `FCP/CCS/20/XXXX`
- Format now requires exactly 4 digits (e.g., `FCP/CCS/20/1234`)
- Updated placeholder text in the UI

### 3. Environment Variables
The `.env` file already contains the correct values:
```
VITE_SUPABASE_URL=https://mgofqsxdgpooqxpqitlf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nb2Zxc3hkZ3Bvb3F4cHFpdGxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNDk5NzIsImV4cCI6MjA3NzgyNTk3Mn0.rtqOP7TFZBZ8q-cem98VOCayi5ngGoPsG_21ee6py-M
```

## Required Supabase Dashboard Configuration

### CRITICAL: Enable Anonymous Sign-ins

To enable guest login functionality, you MUST configure this in your Supabase dashboard:

1. Go to: https://supabase.com/dashboard/project/mgofqsxdgpooqxpqitlf
2. Navigate to: **Authentication** → **Providers**
3. Find **Anonymous** in the providers list
4. Toggle **"Enable Anonymous Sign-ins"** to **ON**

Without this setting, guest login will fail with the error: "Anonymous sign-ins are disabled"

### Email Authentication Settings

Verify these settings are configured correctly:

**Location**: Authentication → Providers → Email

- **Enable Email Provider**: ON
- **Confirm Email**: OFF (recommended for development)
- **Secure Email Change**: ON (recommended)

### URL Configuration

**Location**: Authentication → URL Configuration

Add these redirect URLs:
- `http://localhost:8080`
- Your production domain (when deployed)

## Test Credentials

### Admin Login
- **Email**: `admin@fud.edu.ng`
- **Password**: `admin123`
- **Note**: Account will be auto-created on first login

### Student Login
- **Format**: `FCP/CCS/20/XXXX` (exactly 4 digits)
- **Example**: `FCP/CCS/20/1234`
- **Default Password**: `password`
- **Note**: Accounts are auto-created on first login

### Guest Login
- No credentials required (uses anonymous sign-in)
- Must enable Anonymous provider in Supabase (see above)

## Deployment Steps

1. **Enable Anonymous Sign-ins** in Supabase Dashboard (CRITICAL)
2. Ensure environment variables are set in your deployment platform
3. Deploy the application
4. Test all three login methods:
   - Admin login with email/password
   - Student login with Student ID (FCP/CCS/20/XXXX format)
   - Guest login (anonymous)

## Database Schema

The following tables are already set up via migrations:
- `profiles` - User profile information
- `user_roles` - Role assignments (admin, student, guest)
- `attendance_records` - Daily attendance tracking
- `siwes_locations` - SIWES location assignments

All tables have Row Level Security (RLS) enabled for data protection.

## Troubleshooting

### "Anonymous sign-ins are disabled"
- Enable Anonymous provider in Supabase Dashboard → Authentication → Providers → Anonymous

### "Invalid Student ID"
- Ensure format is exactly: `FCP/CCS/20/XXXX` (4 digits)
- Examples: `FCP/CCS/20/1234`, `FCP/CCS/20/5678`

### "User already registered"
- Use "Sign In" instead of creating a new account
- Check existing users in Supabase Dashboard → Authentication → Users

### Login fails with no error
- Check browser console for detailed error messages
- Verify environment variables are loaded correctly
- Ensure Supabase project is active and not paused

## Build Status

The project has been successfully built with the new configuration:
- Build completed without errors
- All modules transformed correctly
- Ready for deployment
