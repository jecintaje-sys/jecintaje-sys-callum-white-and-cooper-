# Callum White and Cooper

A responsive private file library built with Next.js, TypeScript and Supabase.

## Features
- Email/password sign-up, sign-in and sign-out
- Private per-user file storage
- Upload multiple common document, image, audio and video files
- Search, open (short-lived signed URL), and delete files
- 50 MB per-file limit; executable and script extensions are blocked

## 1. Create Supabase project
Create a project at https://supabase.com. In SQL Editor, run the complete contents of `supabase/schema.sql`.

In Project Settings → API, copy the Project URL and the publishable/anon key. Do not use the service-role key in the browser.

## 2. Configure locally
Copy `.env.example` to `.env.local` and set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Then run:
```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## 3. Deploy to Vercel

Import this GitHub repository at https://vercel.com/new. Recommended project settings:

- Framework Preset: **Next.js**
- Root Directory: **./** (repository root)
- Node.js Version: **22.x** (also pinned in `package.json`)
- Build Command: leave the detected Next.js default (`npm run build`)
- Install Command: leave automatic detection enabled
- Output Directory: leave the detected Next.js default

In Project Settings → Environment Variables, add these two values for **Production, Preview, and Development**:

- `NEXT_PUBLIC_SUPABASE_URL`: your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: your Supabase publishable key or legacy anon key

Do not add a Supabase service-role key to a `NEXT_PUBLIC_` variable or commit credentials to GitHub. Redeploy after changing environment variables.

In Supabase Authentication → URL Configuration, set Site URL to your deployed Vercel URL and add the Vercel URL to Redirect URLs.

## Privacy notes
The storage bucket is private. Storage policies limit listing, reading, uploading and deleting to paths beginning with the signed-in user's auth ID. Never commit secrets or expose a service-role key. The site is not ready for real user data until Supabase is configured and the deployed flows are tested.

## Supported uploads
Common files such as PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV, images, audio and video are supported subject to Supabase limits. Executables and scripts are blocked.