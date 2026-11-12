<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Each guest's entry QR encodes `GKA1:<Firestore document ID>` (never a URL). Only staff listed in the `admins` or `scan-admin` collections can read it back, and `scan-admin` users may only flip `approved` false -> true (see firestore.rules).
