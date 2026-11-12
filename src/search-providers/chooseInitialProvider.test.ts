import { describe, it, expect } from "vitest";
import {
  chooseInitialProvider,
  kLocalDiskProviderId,
  newPreferredProviderId,
} from "./chooseInitialProvider";
import { ISearchProvider, ISearchResult } from "./imageProvider";

function provider(id: string, isReady = true): ISearchProvider {
  return {
    id,
    label: id,
    isReady,
    search: async (): Promise<ISearchResult> => ({ images: [] }),
  };
}

const openverse = provider("openverse");
const artOfReading = provider("art-of-reading");
const pixabay = provider("pixabay");
const pixabayWithoutKey = provider("pixabay", false);

describe("chooseInitialProvider", () => {
  it("waits while there are no sources", () => {
    expect(chooseInitialProvider([], "pixabay", false)).toBeUndefined();
    expect(chooseInitialProvider([], undefined, false)).toBeUndefined();
  });

  it("picks the first source at once when there is no preferred source", () => {
    expect(chooseInitialProvider([openverse], undefined, false)).toBe(
      openverse,
    );
  });

  it("picks the preferred source as soon as it arrives", () => {
    expect(
      chooseInitialProvider([openverse, artOfReading], "art-of-reading", false),
    ).toBe(artOfReading);
  });

  it("waits for a preferred source that has not arrived yet", () => {
    expect(
      chooseInitialProvider([openverse], "pixabay", false),
    ).toBeUndefined();
    // Sanity check: once it arrives, it is chosen.
    expect(chooseInitialProvider([openverse, pixabay], "pixabay", true)).toBe(
      pixabay,
    );
  });

  it("falls back to the first source when the preferred one cannot be used", () => {
    expect(
      chooseInitialProvider([openverse, pixabayWithoutKey], "pixabay", false),
    ).toBe(openverse);
  });

  it("falls back to the first source when the preferred one never arrives", () => {
    expect(
      chooseInitialProvider(
        [openverse, pixabay],
        "uninstalled-collection",
        true,
      ),
    ).toBe(openverse);
  });
});

describe("newPreferredProviderId", () => {
  it("returns a source different from the current one", () => {
    expect(newPreferredProviderId("pixabay", "openverse")).toBe("pixabay");
    expect(newPreferredProviderId("art-of-reading", undefined)).toBe(
      "art-of-reading",
    );
  });

  it("returns undefined when the source is already the preferred one", () => {
    expect(newPreferredProviderId("pixabay", "pixabay")).toBeUndefined();
  });

  it("ignores a file opened from disk", () => {
    expect(
      newPreferredProviderId(kLocalDiskProviderId, "openverse"),
    ).toBeUndefined();
  });

  it("ignores an image with no source", () => {
    expect(newPreferredProviderId(undefined, "openverse")).toBeUndefined();
  });
});
