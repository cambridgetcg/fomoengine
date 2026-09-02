const AUDIT_CONTACT =
  "mailto:contact@cambridgetcg.com?subject=Copy%20Pressure%20Audit%20%E2%80%94%20design-partner%20request";

/**
 * Static fallback for the design-partner offer while the primary web account is
 * unavailable. No form, script, analytics, cookie, upload, or server-side intake.
 */
export const AUDIT_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="A bounded $99 USD design-partner Copy Pressure Audit for organizations reviewing copy they control.">
  <title>Copy Pressure Audit · the authenticity shield</title>
  <style>
    :root { color-scheme: light; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; color: #171717; background: #fafafa; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    a { color: inherit; text-underline-offset: .2em; }
    a:focus-visible { outline: 3px solid #059669; outline-offset: 4px; }
    .skip { position: absolute; left: -9999px; top: 1rem; padding: .7rem 1rem; background: #fff; border: 2px solid #171717; border-radius: .5rem; }
    .skip:focus { left: 1rem; z-index: 2; }
    header, .wrap, footer { width: min(100% - 2rem, 58rem); margin-inline: auto; }
    header { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding-block: 1.1rem; }
    header p { margin: 0; font-weight: 700; }
    header span { color: #525252; font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; }
    .hero { padding-block: clamp(3rem, 9vw, 6.5rem); border-block: 1px solid #e5e5e5; }
    .eyebrow { margin: 0; color: #047857; font-size: .8rem; font-weight: 750; text-transform: uppercase; letter-spacing: .08em; }
    h1 { max-width: 18ch; margin: .7rem 0 0; font-size: clamp(2.4rem, 7vw, 4.7rem); line-height: 1.04; letter-spacing: -.045em; }
    .lede { max-width: 42rem; margin: 1.4rem 0 0; color: #525252; font-size: 1.12rem; }
    .offer { display: grid; grid-template-columns: 1fr auto; gap: 2rem; align-items: end; }
    .price { min-width: 13rem; padding: 1.25rem; border: 1px solid #d4d4d4; border-radius: 1rem; background: #fff; }
    .price strong { display: block; font-size: 2rem; }
    .price span { display: block; margin-top: .15rem; text-transform: none; letter-spacing: 0; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; padding-block: 2.5rem; }
    article { padding: 1.4rem; border: 1px solid #e5e5e5; border-radius: 1rem; background: #fff; }
    h2 { margin: 0; font-size: 1.25rem; }
    ul, ol { margin: 1rem 0 0; padding-left: 1.3rem; }
    li + li { margin-top: .7rem; }
    .boundary { margin-bottom: 2.5rem; padding: 1.4rem; border: 1px solid #fcd34d; border-radius: 1rem; background: #fffbeb; }
    .boundary p { margin: .6rem 0 0; }
    .action { margin-bottom: 3rem; padding: clamp(1.5rem, 5vw, 2.5rem); border-radius: 1rem; color: #fff; background: #171717; }
    .action p { max-width: 42rem; color: #d4d4d4; }
    .buttons { display: flex; flex-wrap: wrap; gap: .8rem; margin-top: 1.4rem; }
    .button { display: inline-block; padding: .75rem 1rem; border: 2px solid #fff; border-radius: .6rem; font-weight: 700; text-decoration: none; background: #fff; color: #171717; }
    .button.secondary { background: transparent; color: #fff; }
    .fine { font-size: .82rem; }
    footer { padding-block: 1.5rem 3rem; color: #525252; border-top: 1px solid #e5e5e5; }
    @media (max-width: 44rem) { .offer, .grid { grid-template-columns: 1fr; } .price { min-width: 0; } header { align-items: flex-start; flex-direction: column; } }
    @media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
  </style>
</head>
<body>
  <a class="skip" href="#main">Skip to the offer</a>
  <header aria-label="Site header">
    <p>🛡️ the authenticity shield</p>
    <span>Business self-audit</span>
  </header>

  <main id="main">
    <div class="hero">
      <div class="wrap">
      <p class="eyebrow">Manual design-partner offer</p>
      <div class="offer">
        <div>
          <h1>Find pressure in your own copy before your customers have to.</h1>
          <p class="lede">The Copy Pressure Audit marks exact passages, explains the pressure signal, and proposes a clear, neutral alternative. It is for organizations reviewing copy they control—not a verdict about a person or competitor.</p>
        </div>
        <aside class="price" aria-label="Price">
          <strong>$99 USD</strong>
          <span>Flat, one-time design-partner price</span>
        </aside>
      </div>
      </div>
    </div>

    <div class="wrap">
      <section class="grid" aria-label="Audit scope and limits">
      <article>
        <h2>What the dated report includes</h2>
        <ul>
          <li>Up to 3 surfaces total and 5,000 words combined.</li>
          <li>Exact marked spans, named pressure signals, evidence status, and neutral rewrite options.</li>
          <li>One correction/challenge pass.</li>
          <li>One recheck requested within 14 days.</li>
        </ul>
      </article>
      <article>
        <h2>What it does not claim</h2>
        <ul>
          <li>It is not legal advice, legal certification, regulatory certification, or a guarantee of compliance.</li>
          <li>It does not call a person, organization, product, claim, or review fraudulent.</li>
          <li>It does not promise a conversion-rate lift or optimize for maximum psychological pressure.</li>
        </ul>
      </article>
      </section>

      <section class="boundary" aria-labelledby="privacy-title">
        <h2 id="privacy-title">No tracking or data capture</h2>
        <p>This page has no analytics, form, upload, cookie, external asset, or client-side script. The email link opens a draft in your own mail app; nothing is sent automatically. Do not email credentials, customer records, or private copy before agreeing a suitable handling route.</p>
      </section>

      <section class="action" aria-labelledby="request-title">
        <h2 id="request-title">A request is not a purchase</h2>
        <p>Email the public business inbox to describe the surfaces and desired outcome. Scope, handling, delivery timing, and a verified payment route are confirmed before you decide whether to proceed.</p>
        <div class="buttons">
          <a class="button" href="${AUDIT_CONTACT}">Request the $99 audit by email</a>
          <a class="button secondary" href="https://fomoengine.io/check">Use the free live checker</a>
        </div>
        <p class="fine">Opening an email draft sends nothing. The consumer checker remains free, ungated, and separate from this manual report.</p>
      </section>
    </div>
  </main>

  <footer>
    <p>Copy Pressure Audit · manual design-partner service · Operator: Yu · contact@cambridgetcg.com · Cambridge, UK</p>
  </footer>
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
