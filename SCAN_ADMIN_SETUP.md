# Entrance scanner (`scan-admin`) setup

## 1. Create a scanner account
1. Firebase console → Authentication → Users → **Add user** (email + password).
2. Copy that user's **UID**.
3. Firestore → start collection **`scan-admin`** → Document ID = the UID → add any field
   (e.g. `name: "Door staff 1"`).
4. Sign in at `/admin/login`. Scan-admins land on `/scan`.

Remove the document to revoke access.

## 2. Security rules
These are the rules that actually enforce the permissions (the UI alone is not security).
**Merge** them into your existing `firestore.rules` — keep what you already have for guests,
settings, RSVPs and `admins`. Multiple `allow` lines for the same operation are OR-ed, so these
only *add* access.

```
function isStaff() {
  return request.auth != null && request.auth.token.firebase.sign_in_provider != 'anonymous';
}
function isScanAdmin() {
  return isStaff() && exists(/databases/$(database)/documents/scan-admin/$(request.auth.uid));
}

// Scanners can check their own membership, and nothing else here. Nobody can write from the client.
match /scan-admin/{uid} {
  allow get: if request.auth != null && request.auth.uid == uid;
  allow list, write: if false;
}

match /invitedGuests/{guestId} {
  // Scan-admins may see the whole guest list ...
  allow read: if isScanAdmin();

  // ... and may ONLY mark a guest approved (false -> true), touching only these fields.
  // They cannot create, delete, edit details, or un-approve.
  allow update: if isScanAdmin()
    && !(resource.data.get('approved', false) == true || resource.data.get('checkedInAt', null) != null)
    && request.resource.data.approved == true
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(
         ['approved', 'approvedAt', 'approvedBy', 'approvedVia',
          'checkedInAt', 'checkedInBy', 'updatedAt']);
}
```

## 3. QR codes
Guest QR codes now contain `GKA1:<guestId>` instead of a web link, so a normal phone camera shows
plain text and opens nothing. Previously issued link-style QR codes are still recognised by the
scanner. Scanning needs camera permission and the site must be served over **https**.
