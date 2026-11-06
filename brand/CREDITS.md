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
| share card (`app/opengraph-image.tsx`) | agents: first made in c77a161 (2026-06-09, git name "Asha Veridian"), redrawn in a3a8f44 (2026-09-08, git name "Nuance"); both commits carry a Claude co-author trailer | 2026-09-08 | next/og (JSX) | the site's own card, not part of the kit. PR #4 linked it and left it unchanged |

## Fonts

| Family | File | Licence | Source | SHA-256 |
|---|---|---|---|---|
| Fraunces (variable; Regular and Light instances) | `Fraunces[SOFT,WONK,opsz,wght].ttf` | SIL Open Font License 1.1 (font name table; Copyright 2020 The Fraunces Project Authors). `kit/BRAND.md` says this licence "was not checked"; that line is older than this check | google/fonts `ofl/fraunces`, upstream https://github.com/undercasetype/Fraunces | `177ff6c0f14e5550a3c624247cd1189611d4eb65d000b14944c63d967958abbb` |
| JetBrains Mono Regular | bundled with vectorcraft-cli | SIL Open Font License 1.1 | https://github.com/JetBrains/JetBrainsMono | (bundled) |

The wordmark and the kit's card are outlined, so no font file is committed or served. The site loads Fraunces and
DM Sans itself through `next/font/google`.

## Images and other material

| Item | Maker | Licence | Source |
|---|---|---|---|
| none: the kit uses no photographs or third-party artwork | | | |
