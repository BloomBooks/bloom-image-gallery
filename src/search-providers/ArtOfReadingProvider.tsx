import axios from "axios";
import {
  IImage,
  ISearchProvider,
  ISearchResult,
  ProviderSummary,
} from "./imageProvider";
import { LicenseType } from "../../common/bloomMediaMetadata";
import logo from "./aor.png?inline"; // at this point if we had collections other than Art of Reading, they will all get this same logo
import React from "react";
import { basePathPrefix, port } from "../../common/locations";
import { Alert } from "@mui/material";
import { useL10n } from "../localization";

/** Derive a LicenseType from a Creative Commons URL. Returns undefined for unrecognised URLs. */
function licenseTypeFromUrl(url: string | undefined): LicenseType | undefined {
  if (!url) return undefined;
  const ccMatch = url.match(/\/licenses\/(by(?:-(?:nc|nd|sa)){0,2})\//i);
  if (ccMatch) return ("CC-" + ccMatch[1].toUpperCase()) as LicenseType;
  if (/publicdomain\/zero/.test(url)) return "CC0";
  return undefined;
}

export class ArtOfReadingProvider implements ISearchProvider {
  public label: string;
  public id: string;
  public logo = logo;
  public isReady = false;
  public local = true;
  // The languages whose keyword indexes are available for searching. The
  // SearchBar shows a language menu when this is set, mirroring the search-language
  // dropdown Bloom offers for Art of Reading via the Palaso ImageToolboxDialog.
  public languages?: string[];

  private collection: string;
  private baseUrl: string;
  // When true the provider talks through a host-app proxy (e.g. Bloom) that uses
  // exact-path routing, so search params are passed as query parameters rather than
  // path segments. When false the AOR server is reached directly (dev mode) and
  // expects the traditional path-segment form.
  private readonly throughProxy: boolean;
  // Collection-level license and credit that apply to every image in this collection.
  private readonly collectionLicenseUrl: string | undefined;
  private readonly collectionCredits: string | undefined;

  // collection is the folder name under the ImageCollections directory.
  // baseUrl defaults to the standalone dev server; callers (e.g. BloomDesktop)
  // pass their own proxy URL so the gallery talks to the host app's server instead.
  // collectionLicenseUrl and collectionCredits are optional per-collection metadata
  // provided by the host (e.g. Bloom) and attached to every image returned by search().
  constructor(
    collection: string,
    baseUrl = `http://localhost:${port}${basePathPrefix}`,
    collectionLicenseUrl?: string,
    collectionCredits?: string
  ) {
    this.collection = collection;
    this.label = collection;
    this.id = collection.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    this.baseUrl = baseUrl;
    this.throughProxy = baseUrl !== `http://localhost:${port}${basePathPrefix}`;
    this.collectionLicenseUrl = collectionLicenseUrl || undefined;
    this.collectionCredits = collectionCredits || undefined;
  }

  public async checkReadiness() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/local-collections/collections`
      );
      const collections: (string | { name: string })[] = response.data.collections;
      const found = collections.some(
        (c) => (typeof c === "string" ? c : c.name) === this.collection
      );
      if (found) {
        this.isReady = true;
        // The server reports which keyword languages the collection's index
        // provides. Fall back to English if it doesn't say.
        this.languages = response.data.languages ?? ["en"];
      }
    } catch {
      // Server not available (e.g. running without the dev server); leave the
      // provider not-ready.
    }
    return this;
  }
  public async search(
    searchTerm: string,
    pageZeroIndexed: number,
    language: string
  ): Promise<ISearchResult> {
    // Bloom's proxy uses exact-path routing so search params go in the query string.
    // The AOR server (direct dev mode) expects path segments.
    const searchUrl = this.throughProxy
      ? `${this.baseUrl}/local-collections/search?collection=${encodeURIComponent(this.collection)}&lang=${language}&term=${encodeURIComponent(searchTerm)}`
      : `${this.baseUrl}/local-collections/search/${encodeURIComponent(this.collection)}/${language}/${encodeURIComponent(searchTerm)}`;
    const response = await axios.get(searchUrl);
    return {
      images: response.data.map(
        (item: string | { url: string; localPath: string; creator?: string; copyright?: string }) => {
          const url = typeof item === "string" ? item : item.url;
          const localPath =
            typeof item === "object" ? item.localPath : undefined;
          const itemCreator =
            typeof item === "object" && item.creator ? item.creator : undefined;
          // Per-image EXIF copyright takes precedence; collection-level credit is the fallback.
          const itemCopyright =
            typeof item === "object" && item.copyright ? item.copyright : undefined;
          return {
            thumbnailUrl: url,
            reasonableSizeUrl: url,
            localPath,
            size: 0,
            type: "PNG",
            license: licenseTypeFromUrl(this.collectionLicenseUrl),
            licenseUrl: this.collectionLicenseUrl,
            credits: itemCopyright ?? this.collectionCredits,
            creator: itemCreator,
            raw: {},
          } as IImage;
        }
      ),
    };
  }

  public aboutComponent(): JSX.Element {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const l10n = useL10n();
    if (this.collection === "Art Of Reading") {
      return (
        <>
          <ProviderSummary title={l10n("ImageLibrary.AboutArtOfReading", "About Art of Reading")}>
            {l10n("ImageLibrary.ArtOfReadingDescription",
              "International Illustrations: Art of Reading 3.0 is a collection of over 11,000 images. The collection is designed for use in the preparation of a wide variety of literacy and educational materials, such as shellbooks, primers, news-sheets, posters, and other culturally appropriate materials. These images are black and white line drawings collected from SIL and national artists from around the world."
            )}
          </ProviderSummary>
          {!this.isReady && (
            <Alert severity="info">
              {l10n("ImageLibrary.ArtOfReadingNotReadyInstructions", "To get Art of Reading images, you need to:")}
              <ol>
                <li>
                  <a
                    href="https://bloomlibrary.org/page/resources/art-of-reading"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l10n("ImageLibrary.DownloadArtOfReading", "Download and install the Art of Reading Installer")}
                  </a>
                </li>
                <li>{l10n("ImageLibrary.QuitAndRerunBloom", "Quit and re-run Bloom")}</li>
              </ol>
            </Alert>
          )}
        </>
      );
    }
    return (
      <ProviderSummary title={this.collection} />
    );
  }
}
