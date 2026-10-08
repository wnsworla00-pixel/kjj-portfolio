# Portfolio editor
The existing React editor is served at /editor. Public portfolio design and the GitHub main -> Vercel flow remain unchanged.
Administrator login is enforced by /api/editor, using a Secure, HttpOnly, SameSite=Strict cookie expiring after eight hours. Never place secrets in VITE_ variables or commit them.

## One-time Vercel setup
Set these server-only environment variables in the Vercel project serving bulhandang.vercel.app, then redeploy:
- EDITOR_ADMIN_PASSWORD: a random password of at least 24 characters, saved in the owner's password manager.
- EDITOR_SESSION_SECRET: an independent random secret of at least 32 characters.
- EDITOR_GITHUB_TOKEN: a fine-grained GitHub token limited to wnsworla00-pixel/kjj-portfolio, Contents read/write. Set an expiry and rotate before it expires.
Do not send these values in chat. Without all three variables, the endpoint returns 503 and denies all data changes.
Login and saving require HTTPS and same-origin requests.

## Save and deletion
The editor loads the current src/portfolio.json from main after login. Saving uses the GitHub Contents API with a SHA concurrency check. Stale writes fail with 409. A successful commit triggers existing Vercel deployment. The public site remains static and updates after deployment succeeds.
Deletion requires typing the exact performance title and also saves other pending edits. It removes the record and its text-style entries from current portfolio data. It does not erase Git history, older deployments or externally hosted images. No actual performance is deleted as part of setup.
If login expires, preserve the current screen; use a separate tab to log in before retrying a save. Refreshing the editor discards unsaved changes. Browser drafts from the legacy editor are not imported automatically.
The old Sites editor is not synchronized with this editor. Reconcile any unexported Sites-only changes before switching; do not use both editors as concurrent sources of truth.
