# Skattbók — Norse Expense Tracker PWA
**Product Requirements Document**

---

## Overview

Skattbók (Old Norse: "tax/treasure ledger") is a Progressive Web App (PWA) designed for iPhone use (iOS Safari, installable to home screen — no App Store). It lets the user photograph receipts, extract structured expense data via AI vision, assign expenses to entities and categories, sync to Google Sheets + Google Drive, and view dashboards by entity.

**Primary user:** James Whitfield — personal use only. Simple auth (PIN or passphrase).

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router) — TypeScript
- **Styling:** Tailwind CSS with Norse/Viking dark theme (dark backgrounds, amber/gold accents, rune-inspired UI)
- **Deployment:** Vercel
- **Vision AI:** Anthropic Claude Sonnet (via API) — receipt OCR and structured extraction
- **Storage:** Google Sheets API v4 (one sheet per entity per year), Google Drive API (receipt images)
- **Auth:** Simple PIN (4-6 digits), stored in localStorage, no backend auth required

---

## Norse Theme & Design Language

| UI Concept | Norse Label |
|---|---|
| App name | Skattbók |
| Dashboard | The Great Hall |
| Capture receipt | Record the Spoils |
| Entities | Clans |
| Categories | Runes |
| Save button | Etch in Stone |
| Export | Send the Ravens |
| Settings | The Forge |
| Delete | Cast into the Fire |
| Payment methods | War Chest |

**Aesthetic:** Dark background (#1a1a1a / #0f0f0f), aged parchment cards (#f5e6c8 text on dark), amber/gold accents (#d4a017), subtle knotwork decorative elements. Clean and usable first — atmospheric second.

---

## Entities (Clans)

Pre-configured entities:
- Stable Mischief
- Sprout & Spindle
- Personal

User can add/rename/delete entities in The Forge (Settings).

---

## Default Expense Categories (Runes)

- Office & Supplies
- Software & Subscriptions
- Travel & Transportation
- Meals & Entertainment
- Equipment & Tools
- Farm & Agriculture
- Marketing & Advertising
- Professional Services
- Utilities
- Other

User can add new categories from The Forge AND inline when capturing a receipt.

---

## Screens & Features

### 1. PIN Entry Screen
- 4-6 digit PIN gate on app open
- PIN set on first launch
- Simple and fast — no full auth flow

---

### 2. Record the Spoils (Capture Screen) — Home Screen

**Flow:**
1. User opens app > PIN > lands on Capture screen
2. Two options: Take Photo (camera) or Upload Image (from camera roll — for offline scenarios)
3. Before AI processing, user must select:
   - Clan (Entity): dropdown — required
   - Rune (Category): dropdown with "Add new..." option — required
4. User submits > image sent to Claude vision API
5. AI returns structured JSON:
   { vendor, date, line_items, subtotal, tax, total, payment_method_hint }
6. Review screen shows extracted data — all fields editable
7. User selects Payment Method (War Chest): saved cards, cash, or other
8. Optional notes field
9. Etch in Stone button > saves to Google Sheets + uploads image to Google Drive
10. Fallback: If AI extraction fails > show manual entry form with same fields

---

### 3. The Great Hall (Dashboard)

**Entity selector:** Dropdown at top — all data scoped to selected entity only. No cross-entity views ever.

**View toggle within selected entity:**
- By Month — list of months with totals > tap month > expense list for that month
- By Category (Rune) — list of categories with totals > tap category > monthly breakdown > tap month > expense list

**Running YTD total** for selected entity shown prominently at top.

**Expense list view** (when drilling down):
- Shows: Date | Vendor | Category | Amount | Payment method
- Tap an expense > opens edit/detail view
- Swipe to delete (with confirmation: "Cast into the Fire?")

---

### 4. Expense Detail / Edit Screen

Editable fields: Vendor, Date, Amount, Tax, Category, Entity, Payment method, Notes, Receipt image

Actions:
- Save changes (Etch in Stone)
- Cast into the Fire (Delete) with confirmation modal

---

### 5. The Forge (Settings)

Sections:
- Clans: entity management (add/rename/delete)
- Runes: category management (add/rename/delete)
- War Chest: payment methods (add card: type + last 4 + nickname, delete)
- Google Connection: OAuth connect/disconnect, connection status
- Send the Ravens (Export): by entity + date range, CSV standard or QuickBooks format
- Security: Change PIN

---

## Google Sheets Schema

One sheet per entity per year: "Stable Mischief - 2026", "Sprout & Spindle - 2026", etc.

Columns: ID | Date | Vendor | Description | Category | Amount | Tax | Total | Payment Method | Card Nickname | Notes | Image URL | Created At

---

## Google Drive Structure

Expense-App/
  [Entity]/
    images/
      [year]/
        {uuid}-{date}.jpg

---

## Duplicate Detection

On save: check if same vendor + date + total exists for the entity. If match: show warning modal before saving.

---

## Error States

- AI fails > "The ravens couldn't read this scroll. Enter the details by hand." > manual form
- Google API error > save as localStorage draft, retry on next open, show toast

---

## Environment Variables

ANTHROPIC_API_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI

---

## User Stories (Ralph Stories)

1. Project scaffold — Next.js 14 + TypeScript + Tailwind, Norse dark theme tokens, base layout with bottom nav, PWA manifest + service worker, Vercel deploy config
2. PIN auth — PIN set on first launch, PIN gate on every open, change PIN in settings, localStorage persistence
3. The Forge — Clans — Entity management screen (add/rename/delete), default 3 entities pre-loaded
4. The Forge — Runes — Category management screen (add/rename/delete), default 10 categories pre-loaded
5. The Forge — War Chest — Payment method management (add card: type + last 4 + nickname, delete), cash + other always present
6. Google OAuth connection — Connect Google account via OAuth 2.0, store tokens, disconnect, show status in Settings
7. Google Sheets integration — Create sheets per entity/year on demand, write expense row on save, read expenses for dashboard
8. Google Drive integration — Upload receipt images to Expense-App/[Entity]/images/[year]/, return shareable URL
9. Receipt capture screen — Camera capture + image upload from roll, entity + category selectors (required), submit to AI API route
10. Claude vision extraction — API route: receive image, call Claude vision, return structured JSON expense data
11. Receipt review and save — Review/edit extracted data screen, payment method selector, notes field, duplicate detection, save to Sheets + Drive
12. Manual entry fallback — Full manual entry form shown when AI fails, same fields and save flow
13. The Great Hall — By Month — Dashboard with entity dropdown, monthly totals list, tap to expense list
14. The Great Hall — By Category — Category totals view, tap category to monthly breakdown, tap month to expense list
15. Expense detail and edit — Tap any expense to edit all fields, save changes back to Sheets, delete with confirmation
16. Send the Ravens — Export — CSV export (standard + QuickBooks format) by entity + date range, file download
17. Draft expense recovery — localStorage drafts for failed Google API saves, retry on next open, toast notification

---

## Out of Scope (v1)

- Multi-user / sharing
- Push notifications
- Automatic bank/card sync
- Direct QuickBooks API integration (export CSV only)
- Dark/light mode toggle (dark only in v1)
- Offline queue (use camera roll upload as workaround)
