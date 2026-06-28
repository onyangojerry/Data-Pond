# Survey-O-Matic 2002

React + Vite survey app backed by Supabase.

The survey question helper uses a free browser-side Hugging Face Transformers.js model. It downloads the model on first use and runs in the publisher's browser; no paid AI API key is required.

## Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. In Supabase, go to Authentication > Providers and make sure Email is enabled.
4. In Authentication > URL Configuration, add your local and production site URLs.
5. Copy `.env.example` to `.env`.
6. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
7. Install and run:

```bash
npm install
npm run dev
```

## Deploy

Use any static host that supports Vite, such as Vercel or Netlify.

Build command:

```bash
npm run build
```

Publish directory:

```text
dist
```

Add these environment variables in the host dashboard:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Security note

Admin pages require Supabase Auth. Published surveys can be viewed and answered by anyone with the public survey link.
