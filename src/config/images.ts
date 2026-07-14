import type { ImageRef } from '../core/types.ts';

/**
 * Production domain for this app (Vercel, subdomain of antoniogaspar.dev).
 * The EXPORTED signature HTML (copy/download) always needs the absolute
 * production URL — email clients have no concept of "relative to this
 * site" like a browser tab does. But during local `vite dev`, resolving to
 * that not-yet-deployed domain made every preview show a broken image, so
 * dev mode serves straight from this app's own `public/signatures/` instead
 * (Vite serves `public/` at the dev-server root). `import.meta.env.DEV` is
 * Vite's own flag — false in `vite build`, so shipped output is unaffected.
 */
const IMAGE_BASE_URL = import.meta.env.DEV
  ? '/signatures'
  : 'https://firmas.antoniogaspar.dev/signatures';

/**
 * `public/signatures/` is APPEND-ONLY for the fixed brand assets below: never
 * rename or delete a file once a signature referencing it may have been
 * saved in Gmail/Outlook. Vercel deploys are atomic snapshots of the repo at
 * that commit — a redeploy cannot itself lose a file, but renaming/deleting
 * one in a future commit breaks every already-published signature that
 * links it. To change one of these images, add a new file and repoint the
 * map below; leave the old file in place, unused.
 */
type ImageKey = 'innobyteLogo' | 'copecLogo' | 'copecPlanet';

// DUOC UC and Personal photos are NOT here — they're user-managed through the
// Blob-backed gallery (see src/gallery/) since they vary per user and are
// swapped without a redeploy. DUOC UC also has no separate logo image — its
// brand identity is the #004AAD color + icons, not a graphic.
const IMAGE_MAP: Record<ImageKey, string> = {
  innobyteLogo: `${IMAGE_BASE_URL}/innobyte-logo.png`,
  // copec-logo.gif is an animated fade-in/out loop that starts and ends on a
  // blank frame — accepted tradeoff: any email client that doesn't animate
  // GIFs will show the logo blank. Frames 34-81 are an identical static
  // plateau (no real motion) — a static export of one of those frames is a
  // safer fallback if this ever needs to be reconsidered.
  copecLogo: `${IMAGE_BASE_URL}/copec-logo.gif`,
  copecPlanet: `${IMAGE_BASE_URL}/copec-planet.jpg`,
};

export function resolveImage(key: ImageKey): ImageRef {
  return IMAGE_MAP[key];
}
