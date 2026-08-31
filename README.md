# Everlasting Invites

Wedding Invitation & RSVP Website

Build a beautiful, elegant, fully responsive Wedding Invitation Website with RSVP functionality, using React + Vite + Firebase.  use the colors in the attached image

The website will be used for a wedding where invited guests can access their personalised digital invitation, RSVP, and download the invitation/program. An administrator will manage invited guests, the wedding information, invitation, RSVP responses, and the wedding program.

1. TECHNOLOGY REQUIREMENTS

Use:

* React
* Vite
* JavaScript/JSX
* Firebase
* Firebase Authentication for admin authentication
* Firebase Firestore for all application data
* Firebase Storage for uploaded invitation/program files
* Responsive design for desktop, tablet and mobile
* Modern component-based architecture
* Clean, maintainable code
* Do NOT use TypeScript
* Do NOT use Supabase
* Do NOT use another backend

Firebase configuration:

```javascript
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBUrjWPr-hOhpuhjB5eOoMivRPjKa9U",
  authDomain: "malloya--app.firebaseapp.com",
  projectId: "malloya--app",
  storageBucket: "malloya--app.firebasestorage.app",
  messagingSenderId: "574142082152",
  appId: "1:574142082152:web:cdb23bd4ddc8ef3c2c1fdd"
};

const app = initializeApp(firebaseConfig);
```

Install/configure the necessary Firebase services:

* Firebase Authentication
* Firestore
* Firebase Storage

Create a central Firebase configuration file and separate service/helper files where appropriate.

---

2. MAIN USER FLOW

The website should have the following flow:

Step 1 — Welcome Page

When an invitee visits the website, they should NOT immediately see the wedding invitation.

Show an elegant welcome/verification page.

Example:

> "You Are Invited"
>
> "Please enter your name and surname to access your invitation."

Fields:

* Name
* Surname

Button:

View My Invitation

---

3. GUEST VERIFICATION

When the invitee submits their name and surname:

1. Search the Firestore invited guests collection.
2. Match the entered name and surname against the invited guest.
3. Matching should be case-insensitive and should ignore accidental leading/trailing spaces.
4. Do not expose the entire guest database to the frontend.
5. Only return the minimum information required for the verified guest.

If the guest exists:

* Grant them access to their invitation.
* Store the verified guest information in the current session/state.
* Navigate to the personalised invitation page.

If the guest does not exist:

Show a friendly error:

> "We couldn't find an invitation matching those details. Please check the spelling of your name and surname and try again."

Do not reveal whether similar guests exist.

---

4. IMPORTANT GUEST PRIVACY/SECURITY

The guest verification system must NOT simply download the entire `invitedGuests` Firestore collection and search it in the browser.

Design the Firebase architecture so that guest information is not publicly readable.

Use a secure approach such as:

* Firebase Authentication/anonymous authentication where appropriate
* Firebase Cloud Function/API endpoint for guest verification
* Or another secure Firebase-compatible verification mechanism

The frontend should never expose the complete guest list.

Guests should only be able to access their own invitation information after successful verification.

---

5. FIRESTORE DATABASE STRUCTURE

Create the application around the following Firestore structure.

`invitedGuests`

Each document represents an invited person/household.

Example:

```text
invitedGuests
   └── guestDocumentId
         firstName: "John"
         surname: "Smith"
         email: ""
         phone: ""
         invitationCode: ""
         invitationType: "individual"
         plusOneAllowed: false
         plusOneName: ""
         numberOfSeats: 1
         rsvpStatus: "pending"
         rsvpResponse: null
         dietaryRequirements: ""
         specialRequirements: ""
         createdAt: timestamp
         updatedAt: timestamp
```

The admin must be able to add, edit and remove invited guests.

---

6. SUPPORT INDIVIDUALS AND HOUSEHOLDS

Design the guest system so that it can support:

Individual invitation

Example:

> John Smith

Seats:

> 1

Couple/family invitation

Example:

> John & Jane Smith

or:

> Smith Family

The admin should be able to specify:

* Number of invited seats
* Whether a plus-one is allowed
* Plus-one name if already known
* Invitation type

The RSVP system should respect the number of seats assigned to the invitation.

---

7. PERSONALISED INVITATION

After successful verification, show the guest their digital wedding invitation.

The invitation page should feel like a premium digital wedding invitation.

Include:

* Couple's names
* Wedding date
* Wedding venue
* Ceremony time
* Reception information
* Elegant wedding imagery
* Wedding message
* Dress code
* RSVP section
* Map/location section
* Download invitation button
* Download program button when a program is available

The invitation should be highly responsive and beautiful on mobile because many guests will access it from their phones.

---

8. WEDDING INFORMATION

Create a Firestore collection/document for the wedding configuration.

Example:

```text
weddingSettings
   └── main
         brideName: ""
         groomName: ""
         weddingDate: ""
         ceremonyTime: ""
         receptionTime: ""
         venueName: ""
         venueAddress: ""
         dressCode: ""
         weddingMessage: ""
         invitationImageUrl: ""
         invitationPdfUrl: ""
         programPdfUrl: ""
         backgroundImageUrl: ""
         musicUrl: ""
         updatedAt: timestamp
```

The admin should be able to edit these details from the dashboard.

Do not hard-code wedding information into the components.

---

9. INVITATION DESIGN

Create a sophisticated wedding aesthetic.

Design direction:

* Elegant
* Romantic
* Premium
* Minimal
* Sophisticated
* Mobile-first
* Smooth animations
* Beautiful typography
* High-quality spacing
* Subtle transitions

Do not make it look like a generic business website.

The invitation should visually resemble a high-end digital wedding invitation.

Use tasteful decorative elements such as:

* Floral details
* Elegant borders
* Subtle animations
* Decorative typography
* Soft backgrounds
* Wedding-themed icons

However, keep the interface readable and performant.

Create reusable components so the wedding design can easily be changed later.

---

10. RSVP SYSTEM

The verified guest must be able to RSVP directly from their invitation.

Create an RSVP section containing:

Attendance

Question:

> "Will you be joining us?"

Options:

* Joyfully accepts
* Regretfully declines

If accepting:

Ask:

* Number of guests attending
* Guest/plus-one name if applicable
* Dietary requirements
* Special requirements
* Optional message to the couple

The maximum number of attendees must never exceed the number of seats assigned to that invitation.

For example:

If:

```text
numberOfSeats = 2
```

the guest cannot RSVP for 3 people.

---

11. RSVP CONFIRMATION

After submitting an RSVP:

Show a beautiful confirmation screen.

For attending guests:

> "We can't wait to celebrate with you!"

For declining guests:

> "Thank you for letting us know. You will be missed."

Allow the guest to return to their invitation.

Save RSVP information to Firestore.

Example:

```text
rsvps
   └── rsvpDocumentId
         guestId: ""
         attending: true
         numberAttending: 2
         guestNames: []
         dietaryRequirements: ""
         specialRequirements: ""
         message: ""
         submittedAt: timestamp
         updatedAt: timestamp
```

Also update the corresponding guest document's RSVP status.

---

12. RSVP EDITING

If a guest has already submitted an RSVP:

Show their current RSVP status.

Allow them to update their RSVP before the RSVP deadline.

Example:

> "Your RSVP has been received."

Button:

Update RSVP

The admin should be able to configure an RSVP deadline.

After the deadline, guests should no longer be able to modify their RSVP.

---

13. ADMIN AUTHENTICATION

Create a protected `/admin` area.

The admin dashboard must require Firebase Authentication.

Only authenticated administrators can access the dashboard.

Do NOT rely only on hiding the admin page in the frontend.

Firebase security rules must prevent unauthorised users from modifying admin data.

Use a secure admin authorization mechanism such as:

* Firebase custom claims
* Or an admin users collection combined with appropriate server-side/security-rule validation

---

14. ADMIN DASHBOARD

Create a beautiful but functional admin dashboard.

Dashboard overview should show:

Statistics

* Total invitations
* Total guests
* RSVPs received
* Pending RSVPs
* Attending
* Declined
* Total confirmed attendees
* Total seats available

Use attractive statistic cards.

---

15. GUEST MANAGEMENT

Admin page:

Invited Guests

Features:

* Add guest
* Edit guest
* Delete guest
* Search guests
* Filter guests
* Sort guests
* View RSVP status
* View number of seats
* View dietary requirements
* View special requirements

Columns:

* Name
* Surname
* Seats
* RSVP
* Attendees
* Dietary Requirements
* Actions

Status badges:

* Pending
* Attending
* Declined

---

16. ADD GUEST

Create an elegant form.

Fields:

* First name
* Surname
* Email
* Phone
* Invitation type
* Number of seats
* Plus-one allowed
* Plus-one name
* Notes

Generate an invitation code automatically if needed.

Validate all fields.

The admin must be able to edit guests later.

---

17. BULK GUEST IMPORT

Add an option for the admin to import guests using CSV.

Example CSV:

```text
First Name,Surname,Email,Phone,Seats,Plus One Allowed
John,Smith,john@email.com,0821234567,2,true
Mary,Jones,mary@email.com,0827654321,1,false
```

Provide:

Import Guests

Validate the CSV before saving.

Show:

* Number of valid records
* Number of invalid records
* Duplicate records
* Errors

Allow the admin to confirm the import.

---

18. PROGRAM MANAGEMENT

The admin must be able to create and publish a wedding program.

Create an admin section:

Wedding Program

The admin can either:

Option A — Upload a PDF

Upload the wedding program PDF to Firebase Storage.

OR

Option B — Create the program inside the admin dashboard

Provide a simple program editor with sections such as:

* Time
* Event
* Description

Example:

```text
14:00 — Arrival
14:30 — Ceremony
16:00 — Photos
17:00 — Reception
18:00 — Dinner
19:00 — Speeches
20:00 — First Dance
```

Allow the admin to save the program.

If the program is created using the editor, generate a downloadable PDF.

---

19. PROGRAM DOWNLOAD

Once the admin publishes the program, verified invitees should see:

Download Wedding Program

The program should only be available to verified guests.

Do not make the program publicly accessible if the wedding organizers want it restricted to invited guests.

Use Firebase Storage for uploaded PDFs.

---

20. INVITATION DOWNLOAD

The guest should also have:

Download Invitation

The invitation can be:

* A PDF uploaded by the admin
* Or a generated PDF based on the wedding information

The download should work properly on:

* Android
* iPhone
* Desktop

---

21. ADMIN WEDDING SETTINGS

Create:

Wedding Settings

Allow the admin to manage:

Couple

* Bride name
* Groom name

Event

* Wedding date
* Ceremony time
* Reception time
* Venue
* Address
* Dress code

Invitation

* Invitation image/PDF
* Background image
* Wedding message

RSVP

* RSVP deadline
* Enable/disable RSVP

Program

* Program PDF
* Published/unpublished

---

22. ADMIN RSVP MANAGEMENT

Create a dedicated RSVP page.

Show a table of responses.

Columns:

* Guest
* Invitation seats
* Attending
* Number attending
* Guest names
* Dietary requirements
* Special requirements
* RSVP date

Add filters:

* All
* Pending
* Attending
* Declined

Add search.

Add export functionality.

Allow admin to export RSVP information as CSV.

---

23. RSVP SUMMARY

Create visual statistics.

Example:

```text
Invited: 100
Seats: 180

Attending: 72
Declined: 18
Pending: 10

Confirmed attendees: 124
```

Calculate these values dynamically from Firestore.

---

24. NAVIGATION

Public routes:

```text
/
 /verify
 /invitation
 /rsvp
 /program
```

Admin routes:

```text
/admin
/admin/login
/admin/dashboard
/admin/guests
/admin/rsvps
/admin/program
/admin/settings
```

Protect all admin routes.

The invitation, RSVP and program pages should require successful guest verification.

---

25. SESSION / GUEST ACCESS

After successful guest verification:

* Store the verified guest ID in a secure session mechanism.
* Do not store sensitive guest information unnecessarily in localStorage.
* Prevent users from simply changing a guest ID in the URL to access another person's invitation.
* Validate access on the backend/Firebase side.

If the browser session expires, require the guest to verify their name and surname again.

---

26. FIREBASE SECURITY

This is extremely important.

Create proper Firestore and Storage security rules.

Guests must NOT be able to:

* Read the complete guest list
* Read other guests' information
* Modify other guests' RSVPs
* Modify wedding settings
* Create admin users
* Modify the wedding program
* Upload arbitrary files
* Access admin data

Administrators must be able to:

* Manage guests
* Manage RSVPs
* Manage wedding settings
* Manage invitation files
* Manage program files

Use least-privilege security rules.

Do not use:

```text
allow read, write: if true;
```

or any equivalent insecure rule.

---

27. FILE STORAGE

Use Firebase Storage for:

* Invitation PDF
* Wedding program PDF
* Wedding images
* Background images

Organize files logically, for example:

```text
wedding/
    invitation/
    program/
    images/
```

Validate uploaded files.

For PDFs:

* Only allow PDF files
* Validate file size

For images:

* Allow appropriate image formats
* Validate file size

---

28. ERROR HANDLING

Create friendly error states for:

* Guest not found
* Firebase unavailable
* RSVP submission failure
* File upload failure
* File download failure
* Invalid CSV
* Admin authentication failure
* RSVP deadline passed

Do not show raw Firebase errors to guests.

---

29. LOADING STATES

Use elegant loading states.

Examples:

* Verifying invitation...
* Loading your invitation...
* Submitting RSVP...
* Preparing download...

Avoid blank screens.

---

30. MOBILE EXPERIENCE

The website must be designed primarily for mobile.

Ensure:

* Large touch targets
* Easy-to-read typography
* Smooth scrolling
* No horizontal overflow
* Responsive invitation
* RSVP form works well on phones
* Download buttons are easy to tap
* Admin dashboard remains usable on mobile/tablet

---

31. ACCESSIBILITY

Include:

* Proper labels
* Keyboard navigation
* Accessible buttons
* Good contrast
* Semantic HTML
* Form validation messages
* ARIA attributes where necessary

---

32. ANIMATIONS

Use subtle premium animations.

Examples:

* Invitation opening animation
* Fade-in sections
* Gentle text animations
* Smooth page transitions
* Button hover effects
* RSVP confirmation animation

Do not overuse animations.

The website should remain fast.

---

33. IMPORTANT ARCHITECTURE

Separate the application into logical areas:

```text
src/
  components/
  pages/
    public/
    admin/
  firebase/
  services/
  hooks/
  utils/
  styles/
```

Create reusable components for:

* Invitation
* Guest verification
* RSVP form
* Admin tables
* File upload
* Statistics cards
* Modals
* Forms
* Notifications

Keep Firebase database operations inside service/helper modules rather than scattering Firestore code throughout UI components.

---

34. FIRST ADMIN SETUP

Create a clear mechanism for creating the first administrator.

Do not create a public admin registration page.

The first admin should be created securely through Firebase Authentication and assigned administrator privileges.

After that, the admin can log in at:

```text
/admin/login
```

---

35. SECURITY CONSIDERATION FOR NAME/SURNAME LOGIN

Do not treat a person's name and surname as a strong authentication method.

This is an invitation-access mechanism, not high-security authentication.

The implementation should minimise exposure of guest information.

If possible, support an additional invitation verification value such as:

* Invitation code
* Unique invitation token
* QR code

However, the primary requested experience should remain:

> Enter name + surname → verify invitation → view invitation.

---

36. ADMIN UI

The admin dashboard should have a professional layout with:

Sidebar:

* Dashboard
* Guests
* RSVPs
* Invitation
* Program
* Wedding Settings

Top bar:

* Admin name
* Logout

Dashboard cards:

* Total Guests
* Invitations
* Pending
* Attending
* Declined
* Total Attendees

Use charts where useful.

---

37. PUBLIC UI

The public invitation should NOT look like an admin dashboard.

The guest-facing experience should feel like a wedding website/invitation.

Suggested flow:

```text
Welcome
   ↓
Enter Name + Surname
   ↓
Invitation Verification
   ↓
Digital Wedding Invitation
   ↓
Wedding Details
   ↓
RSVP
   ↓
Download Invitation
   ↓
Download Program
```

---

38. DATA VALIDATION

Validate:

* Required names
* RSVP selection
* Number attending
* Seat limits
* RSVP deadline
* File types
* File sizes
* Duplicate guests
* CSV structure

Prevent invalid data from being written to Firestore.

---

39. NO MOCK DATA IN FINAL APPLICATION

Build the application so that all actual application data comes from Firebase.

Do not leave the final application dependent on hard-coded mock guests or mock RSVPs.

If sample data is needed during development, clearly isolate it and make it easy to remove.

---

40. FINAL DELIVERABLE

Build the complete working application, not just the UI.

The final application should include:

Guest side

* Welcome page
* Name/surname verification
* Personalised invitation
* Wedding details
* RSVP
* RSVP confirmation
* RSVP editing
* Invitation download
* Program download

Admin side

* Secure login
* Dashboard
* Guest management
* Add/edit/delete guests
* CSV guest import
* RSVP management
* RSVP statistics
* CSV RSVP export
* Wedding settings
* Invitation management
* Program management
* PDF upload
* Program publishing
* File management

Firebase

* Firebase Authentication
* Firestore
* Firebase Storage
* Secure Firestore rules
* Secure Storage rules
* Proper data structure
* Proper access control

---

41. BUILD ORDER

Build the application in this order:

Phase 1

Create the project architecture and Firebase integration.

Phase 2

Build admin authentication and admin dashboard.

Phase 3

Build guest management and Firestore guest collection.

Phase 4

Build guest verification.

Phase 5

Build the digital wedding invitation.

Phase 6

Build RSVP functionality.

Phase 7

Build invitation/program uploads and downloads.

Phase 8

Build program creation/editor.

Phase 9

Build RSVP dashboard, statistics and exports.

Phase 10

Implement and verify Firebase security rules.

Phase 11

Fully optimise the mobile experience.

Phase 12

Test the complete flow from guest verification through RSVP and downloads.

Do not skip the security implementation.

---

42. IMPORTANT

Before considering the project complete, test this exact scenario:

1. Admin logs in.
2. Admin creates John Smith with 2 seats.
3. John visits the public website.
4. John enters "John Smith".
5. John sees only his invitation.
6. John submits an RSVP for 2 people.
7. RSVP appears in the admin dashboard.
8. Admin sees 2 confirmed attendees.
9. John downloads the invitation.
10. Admin publishes a wedding program.
11. John can download the program.
12. A random unauthorised visitor cannot access John's invitation by manipulating the URL.
13. A guest cannot read the entire guest collection.
14. A guest cannot modify another guest's RSVP.
15. An unauthenticated visitor cannot access the admin dashboard.

Build the application with production-ready Firebase security and a polished premium wedding-invitation experience.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f28cfd4a-4369-455c-a2e5-dbf376a82e7a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
