# Il mio garage

Private Sites application for the existing BMW 116i garage in Supabase.

## Runtime

`npm run build` emits an ESM Cloudflare Worker in `dist/server/index.js`.
Sites handles owner-only access and forwards the authenticated user header.
The Worker rejects anonymous requests. Keep this Site owner-private: changing
the Sites audience also changes who can access this single-owner garage.
Supabase credentials are server-side runtime secrets, never browser assets.

Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Sites.
`npm run dev` is a loopback-only preview with a synthetic local identity.
It needs those two environment variables and must never be deployed as a server.

## Data

Uses existing vehicles, categories, refuels, expenses, maintenances and reminders.
`supabase-additions.sql` records additive changes for payment methods and
maintenance payment labels. RLS intentionally permits no direct browser access.
Existing migration/reset scripts in the parent Streamlit project are not used.
Mileage is calculated from the vehicle's initial mileage and actual movements.
Consumption uses completed full-tank intervals, including intermediate partial fills.
Mark full tanks explicitly; the first full tank establishes the initial baseline.
Reminder periodicity is recorded; completion does not create a new reminder.

## Verification

`npm test` covers price calculation, validation and access restrictions.
Browser QA covered refuel creation, persistence across reload, edit and delete,
navigation across five sections at 320/390/1440px, and form type switching.
API integration checks covered payment methods, expenses, maintenance and
reminders; all temporary QA records were deleted by exact ID.
The browser did not expose WebMCP; registration remains feature-detected.

Typography uses Apple's system font on Apple devices with system fallbacks.
Lucide icons are vendored with their original license notice.
