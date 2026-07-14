// Minimal ambient types for Vercel's Node.js Serverless Functions — avoids
// pulling in the full @types/node package (and its Node-vs-DOM global overlap,
// plus vulnerable transitive dev dependencies) just for these three routes.
// Vercel's Node.js runtime hands handlers a classic Node http.IncomingMessage/
// ServerResponse pair, NOT a Fetch API Request/Response.
declare const process: { env: Record<string, string | undefined> };

interface NodeApiRequest extends AsyncIterable<Uint8Array> {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface NodeApiResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(chunk?: string): void;
}
