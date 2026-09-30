import { describe, it, expect } from "vitest";
import { ALL_GALLERY_STRINGS } from "./localization";

// Each localized string's English is written twice: at the l10n() call and in
// ALL_GALLERY_STRINGS, which is what the host is asked to translate.
// Nothing ties the two together at runtime, so these tests do.

// The text of every source file under src, keyed by path.
const sources = import.meta.glob<string>(
  ["./**/*.{ts,tsx}", "!./**/*.test.{ts,tsx}", "!./**/*.d.ts"],
  { query: "?raw", import: "default", eager: true }
);

// A double- or single-quoted string literal; the English is in group 1 or 2.
const literal = String.raw`(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')`;
const unquote = (s: string) => s.replace(/\\(.)/g, "$1");

interface Use {
  file: string;
  id: string;
  english: string;
}

function findUses(): { uses: Use[]; unreadable: string[] } {
  const uses: Use[] = [];
  const unreadable: string[] = [];
  for (const [file, text] of Object.entries(sources)) {
    const calls = new RegExp(
      String.raw`\bl10n\(\s*"([\w.]+)",\s*` + literal,
      "g"
    );
    for (const m of text.matchAll(calls))
      uses.push({ file, id: m[1], english: unquote(m[2] ?? m[3]) });
    // Every call must give its ID and English as plain literals, or the checks below
    // cannot see it.
    const all = text.match(/\bl10n\(\s*(?!\))/g)?.length ?? 0;
    const matched = [...text.matchAll(calls)].length;
    if (all !== matched) unreadable.push(file);
  }
  return { uses, unreadable };
}

describe("ALL_GALLERY_STRINGS", () => {
  const { uses, unreadable } = findUses();

  it("finds the gallery's l10n calls", () => {
    // Guards against the scan silently matching nothing.
    expect(uses.length).toBeGreaterThan(20);
    expect(unreadable).toEqual([]);
  });

  it("has every ID the code uses", () => {
    const missing = uses
      .filter((u) => !(u.id in ALL_GALLERY_STRINGS))
      .map((u) => `${u.file}: ${u.id}`);
    expect(missing).toEqual([]);
  });

  it("has the same English as the code", () => {
    const different = uses
      .filter(
        (u) =>
          u.id in ALL_GALLERY_STRINGS && ALL_GALLERY_STRINGS[u.id] !== u.english
      )
      .map(
        (u) =>
          `${u.file}: ${u.id}\n  code:  ${u.english}\n  table: ${ALL_GALLERY_STRINGS[u.id]}`
      );
    expect(different).toEqual([]);
  });

  it("has no IDs the code does not use", () => {
    const used = new Set(uses.map((u) => u.id));
    const unused = Object.keys(ALL_GALLERY_STRINGS).filter(
      (id) => !used.has(id)
    );
    expect(unused).toEqual([]);
  });
});
