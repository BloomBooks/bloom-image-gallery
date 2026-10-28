import { describe, it, expect } from "vitest";
import { scaledToFit } from "./PixabayProvider";

describe("scaledToFit", () => {
  it("scales a landscape image so its width is the maximum", () => {
    expect(scaledToFit(6000, 4000, 1280)).toEqual({ width: 1280, height: 853 });
  });

  it("scales a portrait image so its height is the maximum", () => {
    expect(scaledToFit(3000, 4500, 1280)).toEqual({ width: 853, height: 1280 });
  });

  it("leaves an image that already fits alone", () => {
    expect(scaledToFit(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });
});
