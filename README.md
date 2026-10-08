# API ToolKit

A browser-based tool for firing an API request on repeat and capturing every response. Configure a URL, method, headers, query params, and body, set a delay between runs, hit **Start**, and watch results come in live. Also includes a purpose-built module for building Samsung DispatchTrack import payloads.

**Live app:** [revanthabbati.github.io/APIToolKit](https://revanthabbati.github.io/APIToolKit/) (once GitHub Pages is enabled — see [Deploying](#deploying))

## Features

- Full request builder — method, URL, query parameters, headers, and a JSON/text body
- Configurable delay between requests and an optional fixed repeat count (or run until stopped)
- Run several requests concurrently, each as its own independent job
- Live capture of every response: status, timing, size, headers, and body
- Clear surfacing of network/CORS failures and timeouts, not just silent gaps
- Per-job stats (success rate, average latency) and a response-time sparkline
- Search/filter history, export as JSON or CSV, export/import full job configs for backup or sharing
- Light/dark/system theme
- Everything persists locally in your browser (`localStorage`) — no account, no backend
- Optional self-deployed proxy (see [`proxy/`](proxy/)) for APIs that block CORS

## How it works

This is a static, client-side React app. There is no server: the scheduler runs with `setTimeout` in your browser tab, and requests are sent directly from the browser with `fetch`. Two consequences follow from that:

- **The tab needs to stay open** for scheduled requests to keep firing. Closing it (or the browser) stops the schedule.
- **Target APIs must allow cross-origin requests (CORS).** Since requests come straight from your browser, an API that doesn't send `Access-Control-Allow-Origin` will block the browser from reading the response — no code in this app can work around that, it's enforced by the browser itself. For APIs you don't control the CORS config of, see the [`proxy/`](proxy/) folder: a small Cloudflare Worker you deploy yourself that makes the request server-to-server instead (no browser, no CORS), which the app can route through via **Proxy settings**.

This is a request scheduler/monitor for testing and watching your own APIs, not a load-testing tool — the minimum delay between requests is intentionally capped (200ms) to avoid accidentally hammering a target.

## Pagination Runner

Paste a cURL command (bash or Windows cmd format) or a URL, mark which query parameters or headers should **Iterate**, set a start/end/step range, and it sends one request per value — e.g. `page_no=1`, `page_no=2`, … up to the end. Use `{{n}}` in the URL path or body for path-style paging, or a step like 25 for offset-style paging. Page-like params (`page`, `page_no`, `_page`, …) are marked to iterate automatically on import.

- Saved endpoints: keep several configurations, duplicate and switch between them.
- Concurrency (1–10), delay between requests, per-request timeout, max 1000 requests per run.
- Stops early when a page comes back with no records, or optionally on the first failure; **Retry failed** re-sends only the requests that failed.
- Results two ways: **Combined** merges the records from every page into one list (the records array is auto-detected, e.g. `eld_devices` or `data.items`, or set it explicitly), and **Individual** shows each response on its own. Download either as JSON, or all pages as a ZIP.
- **Custom export**: pick just the fields you need from the merged records — nested ones too, like `eld_device.vehicle.number` — rename and reorder them, optionally drop duplicate rows, preview, and download as JSON or CSV. The selection is saved with the endpoint, so reruns export the same fields.

## Samsung Import Builder

A second module (its own tab in the app) for a specific workflow: call DispatchTrack's fetch-samsung-orders API for a route, call the export API for each order it returns, and merge everything into one Samsung import payload per order — built from an editable template, the fetched order, the exported customer/item details, and optional overrides. Handles the export API's non-strict XML (a raw `&` DispatchTrack sends that breaks strict parsers), matches items between the two APIs by SKU, and lets you download the results as a combined JSON array or a ZIP of one `import_{do_no}.json` file per order. Same CORS rules as above apply — route it through the proxy for the deployed site.

## Local development

```bash
npm install
npm run dev
```

Then open the printed local URL. To type-check and produce a production build:

```bash
npm run build
npm run preview
```

## Deploying

The included [GitHub Actions workflow](.github/workflows/deploy.yml) builds and deploys the app to GitHub Pages automatically on every push to `main`. The only one-time setup step is enabling Pages for this repository:

1. Go to **Settings → Pages** in this repo.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or re-run the workflow from the **Actions** tab) — the app will be live at `https://<your-github-username>.github.io/APIToolKit/`.

If you fork or rename this repo, update the `base` path in [vite.config.ts](vite.config.ts) to match the new repository name.

## Tech stack

React, TypeScript, Vite, Tailwind CSS — no backend, no external services.

## License

[MIT](LICENSE)
