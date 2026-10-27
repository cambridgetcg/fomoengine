import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { SHARE_CARD } from "./share-card";

// The site serves brand/kit as built, and its head says what the kit says. Adapted from the artcraft-brand
// skill's references/wiring.md §6. When a check fails, copy the kit again or rebuild it from brand/brand.json;
// never hand-edit the kit.
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const KIT_WEB = join(ROOT, "brand/kit/web");
const PUBLIC = join(ROOT, "public");
const APP_DIR = join(ROOT, "app");
// The kit's web/ files this site serves. The share card is the site's own (app/opengraph-image.tsx), not og.jpg.
const SERVED = ["favicon.ico", "favicon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "site.webmanifest"];

const read = (path: string) => readFileSync(path, "utf8");
const sha256 = (path: string) => createHash("sha256").update(new Uint8Array(readFileSync(path))).digest("hex");
const kitHead = read(join(KIT_WEB, "head-snippet.html"));
const layout = read(join(APP_DIR, "layout.tsx"));
const sourcesIn = (dir: string) =>
  readdirSync(join(ROOT, dir), { recursive: true, encoding: "utf8" })
    .filter((name) => /\.[jt]sx?$/.test(name) && !/\.test\.[jt]sx?$/.test(name))
    .map((name) => join(ROOT, dir, name));
const sources = [...sourcesIn("app"), ...sourcesIn("lib"), ...sourcesIn("components")];

for (const name of SERVED) {
  test(`public/${name} matches the kit`, () => {
    assert.equal(sha256(join(PUBLIC, name)), sha256(join(KIT_WEB, name)), `copy brand/kit/web/${name} to public/`);
  });
}

test("serves every icon the manifest names", () => {
  const manifest = JSON.parse(read(join(PUBLIC, "site.webmanifest")));
  for (const icon of manifest.icons) assert.ok(SERVED.includes(icon.src.replace(/^\//, "")), icon.src);
});

// A file-based icon overrides metadata.icons; the create-next-app app/favicon.ico was emitted with sizes 256x256.
test("keeps no file-based icon in the app folder", () => {
  assert.deepEqual(readdirSync(APP_DIR).filter((name) => /^(favicon|icon\d*|apple-icon\d*)\.\w+$/.test(name)), []);
});

test("sets the kit's theme-color in the viewport", () => {
  const colours = [...kitHead.matchAll(/<meta name="theme-color" content="(#[0-9A-Fa-f]{6})"(?: media="\(prefers-color-scheme: (light|dark)\)")?>/g)];
  assert.ok(colours.length > 0, "the kit has no theme-color meta");
  if (colours.length === 1 && !colours[0][2]) {
    // A one-scheme kit (generator 1.8+): one colour, no media query.
    const colour = colours[0][1];
    assert.match(layout, new RegExp(`themeColor:\\s*["']${colour}["']`, "i"), `layout.tsx needs viewport.themeColor: "${colour}"`);
    return;
  }
  assert.equal(colours.length, 2);
  for (const [, colour, scheme] of colours) {
    const entry = `media:\\s*["']\\(prefers-color-scheme: ${scheme}\\)["'],\\s*color:\\s*["']${colour}["']`;
    assert.match(layout, new RegExp(entry, "i"), `layout.tsx needs viewport.themeColor { media: "(prefers-color-scheme: ${scheme})", color: "${colour}" }`);
  }
});

// One color-scheme meta per page: Next.js writes it from viewport.colorScheme, so no source writes another.
test("sets the kit's color-scheme once", () => {
  const scheme = /<meta name="color-scheme" content="([^"]+)">/.exec(kitHead)?.[1];
  assert.equal(scheme, "only light");
  assert.match(layout, new RegExp(`colorScheme:\\s*["']${scheme}["']`), `layout.tsx needs viewport.colorScheme: "${scheme}"`);
  const byHand = sources.filter((file) => /name=["']color-scheme["']|["']color-scheme["']\s*:/.test(read(file)));
  assert.deepEqual(byHand.map((file) => relative(ROOT, file)), []);
});

// Next.js merges metadata shallowly: a page that sets openGraph replaces the layout's, image included.
test("gives every openGraph block the share card", () => {
  // Every `openGraph:` value: a block over several lines (to its closing brace), or the rest of the line.
  const blocks = sources.flatMap((file) => {
    const source = read(file);
    return [...source.matchAll(/^([ \t]*)openGraph:(.*)$/gm)].map((match) => {
      if (match[2].trim() !== "{") return { file, block: match[0] };
      const end = source.indexOf(`\n${match[1]}},`, match.index);
      return { file, block: source.slice(match.index, end < 0 ? undefined : end) };
    });
  });
  assert.ok(blocks.length >= 2, "expected the layout's and pageMetadata's openGraph blocks");
  const missing = blocks.filter(({ block }) => !/\bimages\s*:[^\n]*\bSHARE_CARD\b/.test(block)).map(({ file }) => relative(ROOT, file));
  assert.deepEqual(missing, []);
});

test("the share card describes app/opengraph-image.tsx", () => {
  const card = read(join(APP_DIR, "opengraph-image.tsx"));
  assert.equal(/export const alt = "([^"]+)"/.exec(card)?.[1], SHARE_CARD.alt);
  assert.match(card, new RegExp(`export const size = \\{ width: ${SHARE_CARD.width}, height: ${SHARE_CARD.height} \\}`));
  assert.equal(/export const contentType = "([^"]+)"/.exec(card)?.[1], SHARE_CARD.type);
});
