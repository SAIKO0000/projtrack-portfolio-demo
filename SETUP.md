# Project Setup Guide

## Prerequisites

Make sure you have the following installed on your system:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)

## 1. Clone the Repository

```bash
git clone [YOUR_REPOSITORY_URL]
cd proj_track
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Environment Variables Setup

Create a `.env.local` file in the root directory and add your Supabase credentials:

```bash
# Create the environment file
touch .env.local
```

Add the following content to `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### How to get Supabase credentials:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key
5. Replace the values in your `.env.local` file

## 4. Database Setup

Since you've cloned the database, make sure all tables and policies are properly set up:

### Required Tables:
- `projects`
- `events`
- `photos`
- `personnel`
- `tasks`
- `reports`
- `notifications`

### Storage Buckets:
Make sure you have a storage bucket for photos (typically named `photos` or `project-photos`).

## 5. Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 6. Verification

To verify everything is working correctly:

1. **Check the console** - You should see "✅ Supabase connected successfully"
2. **Navigate to different pages** - Projects, Calendar, Team, etc.
3. **Test data loading** - You should see data from your cloned database

## 7. Build and Production

To build for production:

```bash
npm run build
npm start
```

## 8. Troubleshooting

### Common Issues:

**Environment variables not loading:**
- Make sure `.env.local` is in the root directory
- Restart the development server after adding environment variables
- Check that variable names start with `NEXT_PUBLIC_`

**Supabase connection errors:**
- Verify your Supabase project URL and anon key
- Check if your database is active
- Ensure RLS policies are properly configured

**Dependencies issues:**
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
- Make sure you're using Node.js version 18 or higher

**TypeScript errors:**
- Run `npm run build` to see detailed error messages
- Check that all required types are properly defined

## 9. Available Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 10. Project Structure

```
proj_track/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── calendar.tsx    # Calendar component
│   ├── projects.tsx    # Projects component
│   └── ...
├── lib/                # Utility functions and configurations
│   ├── hooks/          # Custom React hooks
│   ├── supabase.ts     # Supabase client configuration
│   └── ...
├── public/             # Static assets
└── ...
```

## 11. Features Overview

- **Dashboard**: Overview of projects, tasks, and activities
- **Projects**: Project management with status tracking
- **Calendar**: Event scheduling and photo management
- **Team**: Personnel management
- **Reports**: File management and reporting
- **Notifications**: System notifications

## 12. Database Schema

The application expects the following main tables:
- `projects`: Project information and metadata
- `events`: Calendar events and scheduling
- `photos`: File storage references and metadata
- `personnel`: Team member information
- `tasks`: Task management
- `reports`: Document management
- `notifications`: System notifications

## Need Help?

If you encounter any issues during setup:

1. Check the console for error messages
2. Verify your environment variables are correct
3. Ensure your Supabase database is properly configured
4. Check that all required tables exist in your database

---

**Note**: Make sure to never commit your `.env.local` file to version control as it contains sensitive credentials.
