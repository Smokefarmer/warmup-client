# Supabase Authentication Setup

This guide will help you set up Supabase authentication for the Warmup Client application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A new Supabase project

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - **Name**: Warmup Client
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
4. Click "Create new project"

### 2. Configure Authentication Settings

1. In your Supabase dashboard, go to **Authentication** > **Settings**
2. Under **Auth Providers**, make sure **Email** is enabled
3. **Disable Sign-ups** (since you want admin-only user creation):
   - Go to **Authentication** > **Settings**
   - Under **User Signups**, toggle OFF "Enable email confirmations"
   - Set "Allow new users to sign up" to **OFF**

### 3. Get Your Project Credentials

1. Go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (something like `https://xyzcompany.supabase.co`)
   - **anon public** key (the public API key)

### 4. Configure Environment Variables

1. Copy `env.example` to `.env` in your project root:
   ```bash
   cp env.example .env
   ```

2. Update the `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 5. Create Users (Admin Only)

Since sign-up is disabled, you need to create users manually:

1. Go to **Authentication** > **Users** in your Supabase dashboard
2. Click "Add user"
3. Enter the user's email and password
4. The user can now log in with these credentials

## Security Features

- ✅ **No public registration** - Users can only be added by admins
- ✅ **Session management** - Automatic token refresh and session persistence
- ✅ **Protected routes** - All app routes require authentication
- ✅ **Secure logout** - Proper session cleanup on sign out
- ✅ **Email/password authentication** - Standard login flow

## User Management

### Adding New Users
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Enter email and password
4. User can immediately log in

### Managing Existing Users
- **View users**: Authentication → Users
- **Delete users**: Click the user and select "Delete user"
- **Reset passwords**: Click the user and select "Reset password"

## Development

To run the application with authentication:

1. Make sure your `.env` file is configured
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Visit `http://localhost:5174`
4. You'll be redirected to `/login` if not authenticated

## Production Deployment

When deploying to production:

1. Update your Supabase project settings:
   - Go to **Authentication** > **Settings**
   - Add your production domain to **Site URL**
   - Add your production domain to **Redirect URLs**

2. Update your environment variables on your hosting platform with the production Supabase credentials.

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure your `.env` file exists and contains the correct variables
- Restart your development server after adding environment variables

### "Invalid login credentials"
- Check that the user exists in Supabase Dashboard → Authentication → Users
- Verify the email and password are correct

### Users can't access the app after login
- Check that your Supabase project URL and anon key are correct
- Verify that the user exists and is not disabled in the dashboard

## Support

For issues with Supabase setup, check:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Authentication Guide](https://supabase.com/docs/guides/auth)
