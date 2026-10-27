import { describe, it, expect } from "vitest";
import { getWikimediaThumbnailUrl } from "./OpenVerseProvider";

describe("getWikimediaThumbnailUrl", () => {
  it("builds a 330px thumbnail for a large Commons image", () => {
    expect(
      getWikimediaThumbnailUrl(
        "https://upload.wikimedia.org/wikipedia/commons/a/a1/Podarcis_muralis_11.jpg",
        2048
      )
    ).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Podarcis_muralis_11.jpg/330px-Podarcis_muralis_11.jpg"
    );
  });

  it("gives an SVG a PNG thumbnail, even when the SVG is small", () => {
    expect(
      getWikimediaThumbnailUrl(
        "https://upload.wikimedia.org/wikipedia/commons/8/84/Example.svg",
        100
      )
    ).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Example.svg/330px-Example.svg.png"
    );
  });

  it("keeps percent-encoded file names as they are", () => {
    expect(
      getWikimediaThumbnailUrl(
        "https://upload.wikimedia.org/wikipedia/commons/1/1e/Caf%C3%A9_(1).JPG",
        4000
      )
    ).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Caf%C3%A9_(1).JPG/330px-Caf%C3%A9_(1).JPG"
    );
  });

  it("ignores tracking parameters on the image URL", () => {
    expect(
      getWikimediaThumbnailUrl(
        "https://upload.wikimedia.org/wikipedia/commons/f/f0/Coat_of_arms_of_South_Africa_%28heraldic%29.svg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original",
        1191
      )
    ).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Coat_of_arms_of_South_Africa_%28heraldic%29.svg/330px-Coat_of_arms_of_South_Africa_%28heraldic%29.svg.png"
    );
  });

  it("uses the image itself when it is no wider than a thumbnail", () => {
    const url = "https://upload.wikimedia.org/wikipedia/commons/a/a1/Small.png";
    expect(getWikimediaThumbnailUrl(url, 330)).toBe(url);
  });

  it("gives up when the width is unknown", () => {
    expect(
      getWikimediaThumbnailUrl(
        "https://upload.wikimedia.org/wikipedia/commons/a/a1/Podarcis_muralis_11.jpg",
        0
      )
    ).toBeUndefined();
  });

  it("gives up for other hosts and for formats Wikimedia thumbnails differently", () => {
    expect(
      getWikimediaThumbnailUrl("https://live.staticflickr.com/1/2_3.jpg", 2048)
    ).toBeUndefined();
    expect(
      getWikimediaThumbnailUrl(
        "https://upload.wikimedia.org/wikipedia/commons/a/a1/Scan.tif",
        2048
      )
    ).toBeUndefined();
  });
});
