// Minimal ambient type for `process.env` in Vercel Edge Functions — avoids
// pulling in the full @types/node package (and its Node-vs-DOM global overlap)
// just for this one API surface.
declare const process: { env: Record<string, string | undefined> };
