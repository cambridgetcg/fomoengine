/** Static, script-free self-guided review; no paid offer or intake. */
export const AUDIT_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Explore pressure signals in your own words. The paid audit offer is retired.">
  <title>Self-guided pressure review · FOMOengine</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, sans-serif; line-height: 1.65; color: #171717; background: #fafafa; }
    * { box-sizing: border-box; }
    body { max-width: 48rem; margin: auto; padding: 2rem 1.25rem; }
    main { padding: 3rem 0; }
    h1 { font-size: clamp(2rem, 7vw, 3.75rem); line-height: 1.1; }
    a { color: inherit; text-underline-offset: .2em; }
    a:focus-visible { outline: 3px solid #059669; outline-offset: 4px; }
    nav { display: flex; flex-wrap: wrap; gap: 1.5rem; }
    footer { border-top: 1px solid #ddd; padding-top: 1rem; color: #525252; }
  </style>
</head>
<body>
  <header><a href="https://fomoengine.io">FOMOengine · The Attention Lab</a></header>
  <main id="main">
    <p>Self-guided exploration</p>
    <h1>Understand the pressure in your own words.</h1>
    <p>The paid audit offer is retired. There is no new service request, checkout or delivery promise here. Understanding needs no purchase or growth target.</p>
    <p>Use the checker to name pressure signals, then compare its findings with the research. A finding is a question to inspect, not a verdict about a person.</p>
    <nav aria-label="Explore"><a href="https://fomoengine.io/check">Use the free checker</a><a href="https://fomoengine.io/atlas">Read the research atlas</a></nav>
    <h2>Existing requests</h2>
    <p>Earlier paid-review questions can still be sent to contact@cambridgetcg.com. Existing correspondence, agreements and payment records are unchanged.</p>
    <h2>No tracking or data capture</h2>
    <p>This page has no form, script, analytics, upload or payment link. Following the checker link opens a separate service with its own stated privacy boundaries.</p>
  </main>
  <footer>Self-guided findings are not legal advice, legal certification, regulatory certification, or a guarantee of compliance.</footer>
</body>
</html>`;

export function auditPage(): Response {
  return new Response(AUDIT_HTML, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "content-security-policy":
        "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    },
  });
}
