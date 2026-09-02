# FomoEngine Fly API

This directory is the reproducible source for the `fomoengine` Fly service:
the deterministic `/scan` API, its public framework doors, and the optional
x402 payment gate. It is separate from the repository's Next.js/Vercel shield.

The initial source was recovered byte-for-byte from Fly release 5's running
image on 2026-08-20. Commit `550649c` preserves that exact baseline. The
deployment wrapper was reconstructed from the image runtime and Fly Machine
configuration; it pins the observed Bun 1.3.14 runtime by OCI digest.

The only Fly secret used by this service is `X402_PAYTO`. Its absence makes
`/scan` free by design. Values are never stored in this repository. Charging
also requires `X402_ENABLED` to be anything other than `false`; production
keeps it explicitly false until receiver custody and settlement are proven.
The non-secret `X402_PUBLIC_ORIGIN` is pinned in `fly.toml` so payment
challenges name the public HTTPS resource rather than Fly's internal HTTP URL.

`POST /scan` accepts submitted `{ "html": "…" }` or `{ "text": "…" }` JSON,
with a 2,000,000-byte request limit. Remote URL retrieval is deliberately
paused: the service does not make server-side requests to untrusted
destinations. `GET /scan?url=…` and a `url` property return a non-chargeable
400 response. All input is bounded and validated before an enabled payment
gate may return a challenge.

## Verify

```sh
bun install --frozen-lockfile
bun test
docker buildx build --load -t fomoengine-fly:test .
```

## Deploy

```sh
fly deploy --config fly.toml --ha=false
curl --fail https://fomoengine.fly.dev/health
```

The Fly service check proves only that the running process answers `/health`.
It does not test paid settlement, DNS, or the custom domain.
