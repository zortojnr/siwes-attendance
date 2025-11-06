# Supabase Auth Configuration Guide

## Required Supabase Settings

To ensure all authentication methods work correctly, configure the following in your Supabase dashboard:

### 1. Email Authentication Settings
**Location**: Authentication > Providers > Email

- **Enable Email Provider**: ON
- **Confirm Email**: OFF (for development/testing)
- **Secure Email Change**: ON (recommended)
- **Email Allow List**: Leave empty OR add your domain patterns:
  - `*@fud.edu.ng`
  - `*@student.fud.edu.ng`

### 2. Anonymous Sign-ins (Guest Login)
**Location**: Authentication > Providers > Anonymous

- **Enable Anonymous Sign-ins**: ON

If you want to disable guest login, set this to OFF. The app will show a friendly error message.

### 3. Email Templates
**Location**: Authentication > Email Templates

Ensure all email templates are configured (even if email confirmation is disabled for development).

### 4. URL Configuration
**Location**: Authentication > URL Configuration

- **Site URL**: `http://localhost:8080` (development) or your production URL
- **Redirect URLs**: Add both:
  - `http://localhost:8080`
  - Your production domain

## Test Credentials

### Admin Login
- **Email**: admin@fud.edu.ng
- **Password**: admin123

### Student Login
- **Format**: FCP/CSS/20/[4+ digits]
- **Example**: FCP/CSS/20/5678
- **Default Password**: password

### Guest Login
- No credentials required (anonymous sign-in)

## Common Issues & Solutions

### Issue: "Invalid email format"
**Solution**:
- Ensure email domain `@fud.edu.ng` is not blocked
- Check that email provider is enabled
- Verify no special characters in email address

### Issue: "Anonymous sign-ins are disabled"
**Solution**:
- Enable Anonymous provider in Supabase dashboard
- OR remove guest login option from the UI

### Issue: "User already registered"
**Solution**:
- User should use "Sign In" instead of creating new account
- Check Authentication > Users in Supabase dashboard

### Issue: Student ID not accepted
**Solution**:
- Format must be: FCP/CSS/20/XXXX (where X is 4 or more digits)
- Examples: FCP/CSS/20/1234, FCP/CSS/20/5678, FCP/CSS/20/12345

## Security Notes

1. All users get proper role assignment through `user_roles` table
2. Profiles are automatically created on sign-up
3. RLS policies should be in place for all tables
4. Admin accounts should use strong passwords in production

## Database Tables Used

- `auth.users` - Supabase managed user authentication
- `profiles` - User profile information
- `user_roles` - Role assignments (admin, student, guest)

## Role-Based Routing

After successful login:
- **Admin** → `/admin`
- **Student** → `/student`
- **Guest** → `/student` (limited features)
