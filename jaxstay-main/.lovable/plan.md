## 1. Fix profile picture upload
- Investigate the avatar uploader on `src/routes/_authenticated/settings.tsx` against the `avatars` storage bucket. Likely cause: missing per-user folder path or RLS policy mismatch (uploads need `{user_id}/filename.ext`).
- Verify/repair `avatars` bucket RLS so users can upload/update/delete inside their own `auth.uid()` folder, and surface the real error to the user via toast instead of a silent failure.

## 2. Stripe Connect — clearer onboarding for sitters
- Add a **"How payouts work"** explainer card on the sitter dashboard and on the Stripe Connect button:
  1. Connect your Stripe account (one-time, ~3 min)
  2. Owner books and pays through JaxStay
  3. Funds are held in escrow
  4. Both parties confirm the job is complete
  5. Payout is automatically released to your bank (also auto-released 24h after the booking end date)
  6. JaxStay keeps a 15% platform fee
- Improve the `/dashboard?stripe=refresh` and `?stripe=connected` landings: show a friendly status card ("Stripe session expired — click to resume") instead of a silent redirect.
- Once you re-test Stripe and send the screenshot of the dead-end URL, patch the specific failure (likely either an expired account link or our success/cancel URL).

## 3. Brighter "you are here" map pin
- In `src/components/sitters/SitterMap.tsx`, replace the small white dot with a high-contrast pulsing pin: solid accent color (orange/red), white ring, soft pulse animation, larger size, drop shadow. Same treatment in the mini map inside `LiveTrackingPanel`.

## 4. Verification + background checks (Checkr-based, manual upload)
- New badges on sitter profile + cards: **Qualified** (passed sitter test) and **Verified** (gold shield, background check approved).
- Add a "Verification" section in sitter settings:
  - Explainer linking out to Checkr's self-serve background check ($25–35, takes a few days)
  - Upload field for the completed background check PDF (private storage bucket, only sitter + admin can read)
  - Status states: `not_started → uploaded → approved → rejected`
- Admin page (`/admin`): list pending verifications, view PDF, approve/reject with optional note.
- Database: add `verification_status`, `verification_doc_path`, `verified_at` to `profiles`; new `background_checks` private storage bucket.

## 5. Sitter availability calendar (v1)
- Sitter side: calendar in dashboard where they tap dates to mark **unavailable** (block off vacations / busy days). Already-booked dates auto-show as booked and can't be edited.
- Owner side: on the sitter's public profile (`/sitters/$sitterId`), a read-only calendar showing **Available / Booked / Blocked** so they know before requesting.
- Booking-request form disables blocked & booked dates so owners can't request impossible windows.
- Database: new `sitter_availability` table (`sitter_id`, `date`, `status`) with RLS — sitter writes own rows, public reads.
- Status timeline on each booking card: ✓ Requested → ✓ Accepted → ✓ Paid → ✓ In progress → ✓ Completed (visual checkmark progression on both dashboards).

## Technical details
- **Avatar fix**: storage path `${userId}/${uuid}.${ext}`; RLS policies on `storage.objects` filtered by `(storage.foldername(name))[1] = auth.uid()::text`.
- **Map pin**: replace `divIcon` HTML with two stacked elements (pulsing ring + solid dot) using `--accent` and a CSS `@keyframes pulse-ring`.
- **Verification table**: extend `profiles` (no new table needed); private bucket `background-checks`; admin RLS via `has_role(auth.uid(), 'admin')`.
- **Availability table**:
  ```sql
  CREATE TABLE sitter_availability (
    id uuid PK,
    sitter_id uuid NOT NULL,
    date date NOT NULL,
    status text NOT NULL CHECK (status IN ('blocked')),
    UNIQUE(sitter_id, date)
  );
  ```
  Booked dates derived from `bookings` table (status in paid/confirmed/in_progress).
- **Stripe explainer**: pure UI/copy in `dashboard.tsx` + a new `<StripePayoutExplainer />` component; no backend changes.

## Out of scope (this round)
- Direct Checkr API integration (deferred — manual upload is fine for v1).
- Live Stripe dead-end fix until you send the URL screenshot — I'll patch it as a quick follow-up.
- Recurring availability rules (e.g. "every Sunday off") — date-by-date only for v1.
