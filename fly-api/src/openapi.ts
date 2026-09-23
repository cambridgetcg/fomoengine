/** openapi.ts — the machine-readable door plan, served at /openapi.json.
 *  Kept by hand and deliberately small; the truth is the handler in server.ts. */

export function openapiDocument() {
  return {
    openapi: "3.0.3",
    info: {
      title: "fomoscan",
      version: "0.3.1",
      description:
        "Deterministic FOMO/manipulation detector: scans submitted HTML or text for engineered fear-of-missing-out mechanics, staged per the FOMOENGINE loop with FTC-taxonomy receipts. Remote URL retrieval is paused: this service does not make server-side requests to untrusted destinations. JSON request bodies are limited to 2,000,000 bytes. Scans also carry a `rhetoric` block (rhetorlint/0.1 spec): rhetorical tells in the words — agentless passives, hedges, universal absolutes — reported alongside the FOMO score, never folded into it. `rhetoric` reads a declared bounded prefix on very large documents and is null only if the rhetoric analyzer itself fails (the scan is still delivered). Free doors: /manual (the framework as data) and /honeypot (a test page that should score ~100). New paid scans and audit requests are retired; scanning requires no payment signature.",
    },
    servers: [{ url: "https://api.fomoengine.io" }],
    paths: {
      "/scan": {
        get: {
          summary: "Remote URL retrieval is paused",
          deprecated: true,
          responses: {
            "400": { description: "submit HTML or text directly with POST /scan; never charged" },
          },
        },
        post: {
          summary: "Scan submitted raw HTML or plain text",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    html: { type: "string" },
                    text: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Staged diagnosis with receipts", content: { "application/json": {} } },
            "400": { description: "missing/invalid input — never charged" },
            "413": { description: "JSON request body exceeds 2,000,000 bytes — never charged" },
          },
        },
      },
      "/manual": {
        get: { summary: "The FOMOENGINE framework as data (free forever)", responses: { "200": { description: "stages, tells, countermeasures, evidence" } } },
      },
      "/health": {
        get: { summary: "Liveness check", responses: { "200": { description: "process is serving requests" } } },
      },
      "/honeypot": {
        get: { summary: "A deliberately dark-patterned test page (free forever)", responses: { "200": { description: "should score ~100" } } },
      },
      "/audit": {
        get: {
          summary: "Self-guided pressure review; paid audit retired",
          description: "Accessible HTML with no tracking, form, data capture, external asset, or client-side script.",
          responses: {
            "200": {
              description: "Self-guided checker links and existing-request support",
              content: { "text/html": {} },
            },
          },
        },
      },
      "/": {
        get: { summary: "Service index and retired purchase policy", responses: { "200": { description: "index" } } },
      },
    },
  };
}
