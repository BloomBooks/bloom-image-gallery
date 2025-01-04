import { describe, it, expect } from "vitest";
import { LicenseType } from "./bloomMediaMetadata";
import { getStandardizedLicense } from "./metadata-provider";

describe("getStandardizeLicense", () => {
  it("should handle exact license matches", () => {
    const result = getStandardizedLicense("CC-BY");
    expect(result).toEqual({
      license: "CC-BY" as LicenseType,
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    });
  });

  it("should handle case-insensitive matches", () => {
    const result = getStandardizedLicense("cc-by");
    expect(result).toEqual({
      license: "CC-BY" as LicenseType,
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    });
  });

  it("should handle public domain variations", () => {
    const result = getStandardizedLicense("PD");
    expect(result).toEqual({
      license: "Public Domain" as LicenseType,
      licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    });
  });

  it("should fallback to site specific with custom license URL", () => {
    const result = getStandardizedLicense(
      "Custom License",
      "https://example.com/license"
    );
    expect(result).toEqual({
      license: "Site Specific" as LicenseType,
      licenseUrl: "https://example.com/license",
    });
  });

  it("should fallback to site specific with fallback URL", () => {
    const result = getStandardizedLicense(
      "Custom License",
      undefined,
      "https://example.com/fallback"
    );
    expect(result).toEqual({
      license: "Site Specific" as LicenseType,
      licenseUrl: "https://example.com/fallback",
    });
  });

  it("should return undefined for unknown license without fallbacks", () => {
    const result = getStandardizedLicense("Unknown License");
    expect(result).toBeUndefined();
  });

  it("should handle whitespace in license names", () => {
    const result = getStandardizedLicense("  CC-BY  ");
    expect(result).toEqual({
      license: "CC-BY" as LicenseType,
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    });
  });

  it("should handle license names with version numbers", () => {
    const result = getStandardizedLicense(
      "cc-by-sa-4.0",
      "https://creativecommons.org/licenses/by-sa/4.0/"
    );
    expect(result).toEqual({
      license: "CC-BY-SA" as LicenseType,
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    });
  });

  it("should preserve version 3.0 license URLs when provided", () => {
    const result = getStandardizedLicense(
      "CC-BY-SA",
      "https://creativecommons.org/licenses/by-sa/3.0/"
    );
    expect(result).toEqual({
      license: "CC-BY-SA" as LicenseType,
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    });
  });
});
