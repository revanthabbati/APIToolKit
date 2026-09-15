# API ToolKit proxy

A minimal Cloudflare Worker that lets API ToolKit call APIs that block CORS (cross-origin requests from a browser). It can't be hosted on GitHub — GitHub Pages only serves static files — so it deploys separately to Cloudflare's free tier.

## How it works

The app POSTs `{ url, method, headers, body }` to this worker. The worker makes that request itself (server-to-server calls aren't subject to browser CORS), then hands the response back wrapped in JSON with CORS headers the app's origin is allowed to read.

It's locked down two ways so it can't become an open relay for anyone who finds the URL:

- Only requests whose `Origin` header matches `ALLOWED_ORIGIN` are processed.
- Only target URLs whose hostname matches one of `ALLOWED_HOST_SUFFIXES` are forwarded.

Both are constants at the top of [`src/index.js`](src/index.js) — edit them before deploying. Note the origin check only stops casual/accidental misuse (scanners, curious discovery); a deliberate attacker can spoof an `Origin` header. The real security boundary is that this proxy never stores or injects credentials — whatever API key/token the request needs, the caller (the app) still has to supply it, so the proxy only ever grants what the upstream API would already accept directly.

## Deploy it

You'll need a free [Cloudflare account](https://dash.cloudflare.com/sign-up) — you have to create this yourself, it can't be done on your behalf.

```bash
cd proxy
npm install
npx wrangler login
```

`wrangler login` opens a browser to authenticate with your Cloudflare account. Then edit the two constants in `src/index.js`:

- `ALLOWED_ORIGIN` — the origin your app is deployed at, e.g. `https://your-username.github.io`
- `ALLOWED_HOST_SUFFIXES` — the API domain(s) you want to allow, e.g. `['example.com']`

Then deploy:

```bash
npm run deploy
```

Wrangler prints the deployed URL (something like `https://apitoolkit-proxy.your-subdomain.workers.dev`). Paste that into API ToolKit's **Proxy settings**, then enable **Route through proxy** on any request that needs it.

## Local testing

```bash
npm run dev
```

Runs the worker locally (default `http://127.0.0.1:8787`) without needing to deploy — useful for testing against a temporarily-widened `ALLOWED_HOST_SUFFIXES`/`ALLOWED_ORIGIN` before switching them back for the real deploy.
