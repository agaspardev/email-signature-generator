# Email Signature Generator

Generate email-client-safe HTML signatures for multiple identities — university, employer, personal, and a corporate brand — from one small static app. No backend framework, no build complexity beyond Vite.

## Why this exists

Most signature "generators" produce HTML built with flexbox, external Google Fonts, and icon fonts — all of which silently break in Outlook Desktop (which renders email HTML with Word's engine, not a browser) and in clients that strip external stylesheets. Every signature this tool produces is built from nested `<table>` elements with inline styles only, verified against that constraint at render time.

## Categories

- **DUOC UC** — university email signature, with a profile photo and academic fields (career, school, shift, campus).
- **Innobyte** — employer signature, matched pixel-for-pixel against the brand's existing signature template (colors, font stack, weights).
- **Personal** — a minimal, privacy-conscious signature for personal email: name, a short professional tagline, and two links. No phone, address, or employer info.
- **Copec** — corporate signature with a logo and organizational fields (subgerencia/gerencia), fixed office address.

## How it works

1. Pick a category from the dropdown.
2. Fill in the fields — the preview builds up live as you type. Every field is optional; the signature just renders whatever you've filled in so far.
3. **Copy** puts the signature on the clipboard as rich HTML (`text/html`), ready to paste into a Gmail or Outlook Web compose window.
4. **Download** produces a `.htm` file for Outlook Desktop's Signatures folder (`%APPDATA%\Microsoft\Signatures`), where copy-paste is less reliable.

## Profile photo gallery

DUOC UC and Personal support a profile photo, stored in [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) rather than committed to the repo — upload, select, and delete photos directly from the app, no redeploy needed. Uploading and deleting require a password (see **Environment variables** below); browsing and selecting existing photos doesn't.

Innobyte and Copec use fixed brand assets committed under `public/signatures/` instead, since those don't vary per signature.

## Tech stack

- [Vite](https://vite.dev/) + TypeScript, no UI framework — the actual complexity here is generating correct, constrained HTML, which a component framework doesn't help with.
- A small constrained builder (`src/core/builder.ts`) is the *only* way templates produce markup — flexbox, grid, external fonts, and class-based CSS are structurally impossible to emit, not just discouraged. A runtime guard (`src/core/guard.ts`) double-checks every render.
- Two Vercel Edge Functions (`api/blob-*.ts`) handle the photo gallery's upload/list/delete against Vercel Blob.

## Local development

```bash
npm install
npm run dev      # Vite dev server — signature preview and export work fully
npm run build    # type-check + production build
```

The photo gallery's API routes only run on Vercel (locally via `vercel dev`, or once deployed) — under plain `vite dev` the gallery shows a clear "not available in this environment" message instead of failing silently.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `GALLERY_PASSWORD` | Yes, for photo upload/delete | Set in the Vercel project's environment variables. Anyone with this password can add or remove gallery photos — keep it private. |
| `BLOB_READ_WRITE_TOKEN` | Auto-provisioned | Set automatically once a Blob store is connected to the Vercel project. No manual setup needed. |

## Deployment

Deploys as a static Vite site with two Edge Functions on Vercel. Connect the repository, add a Blob store to the project, and set `GALLERY_PASSWORD` in the environment variables — no other configuration required.
