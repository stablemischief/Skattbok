# Skattbók — Build Specification

## What to Build

A Norse-themed Progressive Web App (PWA) for iPhone expense tracking.
- Installable to iOS home screen via Safari (no App Store)
- Receipt photo capture → Claude Vision AI extracts expense data → saves to Google Sheets
- Receipt images stored in Google Drive
- Dashboard by entity (Stable Mischief / Sprout & Spindle / Personal)

## Auth

Use **Clerk** with Google OAuth provider. No PIN system.
- User signs in with Google on first open
- Clerk handles session persistence
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY env vars required
- Since this is a personal app, optionally restrict to specific email domain/address

## Tech Stack

- Next.js 14+ App Router, TypeScript
- Tailwind CSS — Norse dark theme (bg: #0f0f0f, accent: #d4a017 amber/gold, text on cards: #f5e6c8)
- Clerk (auth + Google OAuth)
- Anthropic Claude Sonnet vision API (receipt extraction)
- Google Sheets API v4 (expense storage)
- Google Drive API (receipt image storage)
- Vercel deployment

## Norse Theme Vocabulary

- App: Skattbók
- Dashboard: The Great Hall
- Capture screen: Record the Spoils
- Entities (businesses): Clans
- Categories: Runes
- Save: Etch in Stone
- Export: Send the Ravens
- Settings: The Forge
- Delete: Cast into the Fire
- Payment methods: War Chest

## Screens

### 1. Record the Spoils (Home / Capture)
- Take Photo (camera) OR Upload from camera roll
- Required dropdowns before processing: Clan (entity) + Rune (category, with "Add new..." inline)
- Submit → Claude Vision API route → structured JSON returned
- Review/edit screen: vendor, date, amount, tax, line items, notes
- War Chest: select payment method (saved cards showing nickname + last 4, cash, other)
- Etch in Stone → save row to Google Sheets + upload image to Google Drive
- If AI fails → "The ravens couldn't read this scroll" → manual entry form

### 2. The Great Hall (Dashboard)
- Entity dropdown at top (no cross-entity views)
- Scoped entirely to selected entity
- Toggle: By Month | By Category (Rune)
  - By Month: monthly totals list → tap month → expense list
  - By Category: category totals → tap category → monthly breakdown → tap month → expense list
- YTD total for selected entity shown at top
- Tap any expense → detail/edit screen
- Swipe to delete → "Cast into the Fire?" confirmation

### 3. Expense Detail / Edit
- Edit: vendor, date, amount, tax, category, entity, payment method, notes, image
- Etch in Stone (save) | Cast into the Fire (delete with confirm)
- Changes sync back to Google Sheets row

### 4. The Forge (Settings)
- Clans: add/rename/delete entities (default: Stable Mischief, Sprout & Spindle, Personal)
- Runes: add/rename/delete categories (default 10 categories)
- War Chest: manage saved cards (type + last 4 + nickname, delete)
- Google Connection: OAuth status, connect/disconnect
- Send the Ravens (Export): entity + date range → CSV (standard) or CSV (QuickBooks format) download
- Account: Clerk sign out

## Google Sheets Structure

One spreadsheet per entity per year: "Stable Mischief - 2026"
Columns: ID | Date | Vendor | Description | Category | Amount | Tax | Total | Payment Method | Card Nickname | Notes | Image URL | Created At

New year = new sheet created automatically on first save of that year.

## Google Drive Structure

Expense-App/[Entity Name]/images/[year]/{uuid}-{YYYY-MM-DD}.jpg

## Duplicate Detection

On save: check if same vendor + date + total exists. If yes → warning modal before proceeding.

## Error Handling

- AI fails → manual entry fallback with same form
- Google API error → save as localStorage draft, toast notification, retry on next open

## Environment Variables

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
ANTHROPIC_API_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI

## Local Dev Setup

App must run locally with `npm run dev`. Include .env.example with all required vars documented.
Provide SETUP.md with step-by-step: Clerk setup, Google Cloud Console OAuth + Sheets + Drive API setup, env vars, running locally.

## PWA Requirements

- manifest.json with Norse-appropriate icons, name "Skattbók", theme_color: #0f0f0f
- Service worker for installability
- Mobile-first responsive design optimized for iPhone screen sizes
- Bottom navigation bar for main screens

## Out of Scope (v1)

- Multi-user
- Push notifications
- Bank/card sync
- Direct QuickBooks API (CSV export only)
- Light mode
