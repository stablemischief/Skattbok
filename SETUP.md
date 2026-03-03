# Skattbok Setup Guide

## Prerequisites

- Node.js 18+
- npm 9+
- A Clerk account (https://clerk.com)
- A Google Cloud Console project
- An Anthropic API key

## 1. Clone and Install

```bash
git clone <repo-url>
cd skattbok
npm install
```

## 2. Clerk Setup

1. Create a Clerk application at https://dashboard.clerk.com
2. Enable **Google** as a social connection provider
3. In the Google provider settings, add these **additional OAuth scopes**:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
4. Copy your keys from the API Keys page

## 3. Google Cloud Console Setup

1. Go to https://console.cloud.google.com
2. Create a new project (or use existing)
3. Enable these APIs:
   - Google Sheets API
   - Google Drive API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Add Clerk's Google OAuth redirect URI (found in Clerk dashboard under Google provider settings)
5. Copy the Client ID and Client Secret into Clerk's Google provider configuration

## 4. Anthropic API Key

1. Go to https://console.anthropic.com
2. Create an API key
3. Copy the key

## 5. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the values:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key
CLERK_SECRET_KEY=sk_test_your-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

## 6. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000. You'll be redirected to sign in with Google via Clerk.

## 7. Build for Production

```bash
npm run build
npm start
```

Note: The build uses `--webpack` flag because Serwist (PWA service worker) requires webpack for SW compilation.

## 8. Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## PWA Testing

To test PWA features (service worker, installability) locally:

```bash
npm run build
npm start
```

The service worker is disabled in development mode to prevent stale caching issues.

On iOS: Open in Safari > Share > Add to Home Screen.

## Troubleshooting

### "No Google OAuth token found"
- Ensure Google is configured as a social connection in Clerk
- Ensure the additional OAuth scopes are added (spreadsheets + drive.file)
- Sign out and sign back in to get new tokens with the correct scopes

### Build fails with Turbopack error
- The build script uses `--webpack` flag. If running `next build` directly, add `--webpack`

### Service worker not registering
- SW is disabled in development. Build and run production to test
- Check Chrome DevTools > Application > Service Workers
