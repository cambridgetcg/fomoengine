# Credits

Who made each asset, with what, and under which licence. Where an agent made something, the line says so, and
anything published under Yu's accounts carries that through. If an asset's maker isn't known, write "not recorded"
rather than guessing.

## Assets

| Asset | Made by | Date | Tools | Notes |
|---|---|---|---|---|
| kit/ (generated) | agent (Claude Code session dd025d89), on the Studio | 2026-10-27 | artcraft-brand brandkit.py 1.8, vectorcraft-cli 0.17.0 | built from brand.json; verify 272 checks, 0 failed; a rebuild gave 71 byte-identical files (PR #4) |
| mark.svg | the same agent, as a file copy of the site's header mark | 2026-10-27 | by hand from `components/attention/site-shell.tsx` | geometry unchanged; `currentColor` written as #B93622 |
| the header mark itself (`components/attention/site-shell.tsx`) | an agent: commit a3a8f44 carries "Co-Authored-By: Claude", under the git name "Nuance" | 2026-09-08 | by hand (inline SVG) | "feat: build research-informed Attention Lab". Who chose it is not recorded beyond that commit |
| mark-small.svg | the same agent as the kit | 2026-10-27 | by hand | the 16-48 px favicon cut: no diagonals, 2-unit strokes, ring r 13, hub r 4.5 (PR #4) |
| share card (`app/opengraph-image.tsx`) | agents: first made in c77a161 (2026-06-09, git name "Asha Veridian"), redrawn in a3a8f44 (2026-09-08, git name "Nuance"); both commits carry a Claude co-author trailer | 2026-09-08 | next/og (JSX) | the site's own card, not part of the kit. PR #4 linked it and left it unchanged. On 2026-11-10 an agent (Claude Code, Opus 5.5) set its closing note as two lines, which had run together as "evidence.Keep" (review 2026-11-02, item A1) |

## Build fonts

Fonts the kit's build needs (also listed under `build.fonts` in `brandkit.json`).

| Family | File | Licence | Source | SHA-256 |
|---|---|---|---|---|
| Fraunces (variable; Regular and Light instances) | `Fraunces[SOFT,WONK,opsz,wght].ttf` | SIL Open Font License 1.1 (font name table; Copyright 2020 The Fraunces Project Authors). `kit/BRAND.md` says this licence "was not checked"; that line is older than this check | google/fonts `ofl/fraunces`, upstream https://github.com/undercasetype/Fraunces | `177ff6c0f14e5550a3c624247cd1189611d4eb65d000b14944c63d967958abbb` |
| JetBrains Mono Regular | bundled with vectorcraft-cli | SIL Open Font License 1.1 | https://github.com/JetBrains/JetBrainsMono | (bundled) |

The wordmark and the kit's card are outlined, so no font file from this table is committed or served.

## Page fonts

The site loads Fraunces and DM Sans itself through `next/font/google` in `app/layout.tsx`. While `next build` runs,
Next.js downloads the files from Google Fonts and the site serves its own copies under `/_next/static/`, so the bytes
below are what visitors receive. A build made after Google Fonts publishes a new version of a family ships new
files.

| Family | Subset (served file) | Bytes | Licence | Source | SHA-256 |
|---|---|---|---|---|---|
| Fraunces (variable, wght 100-900) | latin, preloaded (`03bda585a99c6450-s.p.*.woff2`) | 36,560 | SIL Open Font License 1.1 (Google Fonts `ofl/fraunces`) | https://fonts.gstatic.com/s/fraunces/v38/6NUu8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib14c7qv8oRcTn.woff2 | `88e17be075f1be50ab67b057b99e3701b828f44ed28f9452df6c02645bb0cba9` |
| Fraunces | latin-ext (`b35b0dbffda7f2c4-s.*.woff2`) | 33,640 | the same | https://fonts.gstatic.com/s/fraunces/v38/6NUu8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib14c1qv8oRcTnaIM.woff2 | `f1451edd6434085c4f9f3a8b4a674182dd7d6acccf53bfced19fd167f0705a06` |
| Fraunces | vietnamese (`1e219c03c996efbd-s.*.woff2`) | 11,536 | the same | https://fonts.gstatic.com/s/fraunces/v38/6NUu8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib14c0qv8oRcTnaIM.woff2 | `250cc2966c658fb6d336731de9d82a8129025e9839c20c253bbc477852f6cf4f` |
| DM Sans | latin, latin-ext | not recorded | SIL Open Font License 1.1 (Google Fonts) | `next/font/google` | not recorded |

Checked 2026-11-10 by an agent (Claude Code, Opus 5.5): the three Fraunces files that https://fomoengine.io served
that day, those from a local `next build` of main at 1263b33 (Next.js 16.3.4), and the Google Fonts files above had
the same SHA-256. The licence is the one google/fonts records for the family (`ofl/fraunces/METADATA.pb`:
`license: "OFL"`); the name table inside these woff2 files was not read. They are subsets cut by Google Fonts, not
the build font above, so their hashes differ from it.

## Images and other material

| Item | Maker | Licence | Source |
|---|---|---|---|
| none: the kit uses no photographs or third-party artwork | | | |
