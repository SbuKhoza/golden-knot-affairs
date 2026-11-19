# Elegant wedding admin refresh

## Goal
Restyle the existing staff portal to match the uploaded wedding dashboard reference while preserving all current data, permissions, and workflows. Show a clear result dialog after every scan or manual guest approval.

## Experience
- Create a cohesive blush, rose, ivory, and gold editorial look with refined serif headings, floral accents, and a polished responsive layout.
- Refresh the shared admin navigation/header plus the dashboard, guest list, RSVPs, check-in, program, settings, and sign-in screens; keep all existing controls and behavior.
- Present check-in outcomes in a modal for approved, already approved, not found, invalid QR, and errors. Provide **Accept the next guest** and **Close**; the next-guest action clears the result and leaves the scanner ready.
- Manual approval uses the same outcome modal. Preserve the current Firestore approval rules and scanner/admin permissions.

## Technical details
- Reuse the current TanStack routes, Firebase services, authorization, and state transitions; do not modify backend logic.
- Use the existing semantic theme tokens and shared AdminShell for the visual system. Add only an app-scoped decorative floral asset if needed to match the supplied reference.
- Keep a compact mobile navigation, readable tables/forms, and the guest-scanner route visually consistent with the admin portal.