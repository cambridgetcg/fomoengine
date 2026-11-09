# FOMOengine: brand

This folder holds FOMOengine's brand kit, made with storytold's Craft apps through the artcraft-brand skill (the
private repository `cambridgetcg/brandkit`). `brandkit.json` records this project's details, and `check.mjs` checks
them.

## The look

The site's existing look, as an agent read it on 2026-10-27: the header's ring-and-spokes mark in brick #B93622 on
paper #F4F0E8, a Fraunces wordmark, and light pages only. The share card stays the site's own `/opengraph-image`.
The agent was Claude Code session dd025d89, working under Yu's delegation of 2026-10-20. Yu's word of 2026-10-27
("yes, go ahead and wire the kits into the sites") approved wiring the kits into the sites; it did not choose this
look. The record is fomoengine PR #4 (merge 449ebde), section "Look decisions", and the decisions ledger item
`artcraft-estate-wiring`.

Don't change the identity without its owner's word. Every asset here records who made it in `CREDITS.md`.

## What is here

| Path | What it is |
|---|---|
| `brandkit.json` | this project's details: the look and who chose it, the kit, the files the site serves, its guards, what a deploy does |
| `brand.json` | the generator's input |
| `mark.svg` | the mark: the header SVG from `components/attention/site-shell.tsx`, with `currentColor` written as #B93622 |
| `mark-small.svg` | the simplified cut that draws the 16-48 px favicons (no diagonal spokes, heavier strokes) |
| `kit/` | the built kit. Never edit it by hand: change `brand.json` or the mark and rebuild. `kit/BRAND.md` is its guide |
| `CREDITS.md` | who made what, with fonts and their licences |
| `check.mjs` | the check, copied from brandkit; update it there, not here |

## Rebuild

From this folder, on a Mac with the Craft CLIs and the Fraunces variable font installed (`brandkit.json` names the
file and its SHA-256):

```sh
python3 ~/.kingdom/tools/artcraft-brand/scripts/brandkit.py brand.json --out kit --rebuild-check
```

Then copy the kit files that `brandkit.json` lists under `serve.files` into `../public`:

```sh
for f in favicon.ico favicon.svg apple-touch-icon.png icon-192.png icon-512.png icon-maskable-512.png site.webmanifest; do
  cp "kit/web/$f" ../public/
done
```

`og.jpg` is not copied: the site draws its own card. Then, from the repository root:

```sh
node brand/check.mjs
npm test
```

## How the site uses it

Next.js app router. The seven kit files above are served from `public/`. `app/layout.tsx` sets `metadata.icons`,
`manifest`, and `viewport` (`themeColor: "#F4F0E8"`, `colorScheme: "only light"`) from the kit's head snippet. The
share card is `app/opengraph-image.tsx`, rendered at `/opengraph-image`, and `lib/share-card.ts` (`SHARE_CARD`)
names it in every `openGraph` block, because a page's `openGraph` replaces the layout's. `lib/brand-kit.sync.test.ts`
holds all of this to the kit in `npm test`, and `lib/brand-folder.test.ts` runs `brand/check.mjs` there too.

## Deploying

A merge to `main` deploys production: Vercel's Git integration builds it and serves https://fomoengine.io.
`.vercelignore` leaves `brand/` out of the upload, so only `public/` reaches the site. Vercel answers
`cache-control: public, max-age=0, must-revalidate`, and its edge cache is per deployment, so nothing needs purging.
After a deploy, check the served files and head tags per the skill's `references/wiring.md` §7.

The pull request CI (`shield-guardrail`) runs `npm test`, which includes the sync test and this folder's check. A merge needs Yu's word, or
the repository owner's, for that merge. The repository's `AGENTS.md` and `PLEDGE.md` apply: no commercial targets,
and the free path is never gated.
