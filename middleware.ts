import { next } from '@vercel/edge';

// Duplicated in api/login.ts rather than imported from a shared local module —
// Vercel's Edge bundler mis-bundles local files shared between middleware.ts
// and an api/ Edge Function (each is built as an independent Edge bundle),
// producing a false "referencing unsupported modules" build failure.
const SESSION_COOKIE = 'site_session';

/**
 * A token derived from the site password via HMAC-SHA256 — not the password
 * itself, and not guessable without knowing SITE_PASSWORD. Deterministic
 * (same password -> same token) so middleware can recompute and compare it
 * without needing separate server-side session storage.
 */
async function computeSessionToken(secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode('site-session'));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return undefined;
}

export const config = {
  // Everything except the login endpoint itself — otherwise submitting the
  // password would be blocked by the very check it's trying to pass.
  matcher: '/((?!api/login).*)',
};

function loginPage(showError: boolean): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Acceso — Email Signature Studio</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@500;700;800&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    font-family: 'Nunito', system-ui, sans-serif; background: #f6f8fa; padding: 16px;
  }
  form {
    width: 100%; max-width: 320px; background: #fff; border-radius: 14px; padding: 32px;
    box-shadow: 0 10px 25px -5px rgb(10 10 15 / 0.12);
  }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .brand-mark {
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    background: linear-gradient(135deg, #194163 0%, #2d6a7e 100%);
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 13px;
  }
  h1 { margin: 0; font-size: 17px; color: #194163; }
  p.error { color: #d4183d; font-size: 13px; margin: 0 0 12px; }
  input {
    width: 100%; padding: 10px 12px; font-size: 15px; font-family: inherit;
    background: #f3f3f5; border: 1px solid transparent; border-radius: 10px; margin-bottom: 14px;
  }
  input:focus { outline: none; border-color: #49b6bd; box-shadow: 0 0 0 3px rgba(73,182,189,0.15); }
  button {
    width: 100%; padding: 11px; font-size: 14px; font-weight: 700; font-family: inherit;
    color: #fff; background: #194163; border: none; border-radius: 10px; cursor: pointer;
  }
  button:hover { background: #2d6a7e; }
</style>
</head>
<body>
  <form method="POST" action="/api/login">
    <div class="brand"><div class="brand-mark">ES</div><h1>Acceso privado</h1></div>
    ${showError ? '<p class="error">Contraseña incorrecta.</p>' : ''}
    <input type="password" name="password" placeholder="Contraseña" autofocus required />
    <button type="submit">Ingresar</button>
  </form>
</body>
</html>`;
}

export default async function middleware(request: Request): Promise<Response> {
  const secret = process.env.SITE_PASSWORD;
  if (!secret) {
    // Fail closed, not open — a misconfigured deploy must not become public.
    return new Response('Site not configured: missing SITE_PASSWORD.', { status: 500 });
  }

  const token = readCookie(request, SESSION_COOKIE);
  if (token) {
    const expected = await computeSessionToken(secret);
    if (token === expected) {
      return next();
    }
  }

  const url = new URL(request.url);
  const showError = url.searchParams.get('error') === '1';
  return new Response(loginPage(showError), {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
