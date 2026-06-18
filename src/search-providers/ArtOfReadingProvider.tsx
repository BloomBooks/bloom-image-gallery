import axios from "axios";
import {
  IImage,
  ISearchProvider,
  ISearchResult,
  ProviderSummary,
  StandardDisclaimer,
} from "./imageProvider";
import logo from "./aor.png?inline"; // at this point if we had collections other than Art of Reading, they will all get this same logo
import React from "react";
import { basePathPrefix, port } from "../../common/locations";
import { Alert } from "@mui/material";
import { useL10n } from "../localization";

export class ArtOfReadingProvider implements ISearchProvider {
  public label = "Art of Reading";
  public id = "aor";
  public logo = logo;
  public isReady = false;
  public local = true;
  // The languages whose keyword indexes are available for searching. The
  // SearchBar shows a language menu when this is set, mirroring the search-language
  // dropdown Bloom offers for Art of Reading via the Palaso ImageToolboxDialog.
  public languages?: string[];

  private collection = "Art Of Reading";
  private baseUrl: string;
  // When true the provider talks through a host-app proxy (e.g. Bloom) that uses
  // exact-path routing, so search params are passed as query parameters rather than
  // path segments. When false the AOR server is reached directly (dev mode) and
  // expects the traditional path-segment form.
  private readonly throughProxy: boolean;

  // baseUrl defaults to the standalone dev server; callers (e.g. BloomDesktop)
  // pass their own proxy URL so the gallery talks to the host app's server instead.
  constructor(
    baseUrl = `http://localhost:${port}${basePathPrefix}`
  ) {
    this.baseUrl = baseUrl;
    this.throughProxy = baseUrl !== `http://localhost:${port}${basePathPrefix}`;
  }

  public async checkReadiness() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/local-collections/collections`
      );
      if (response.data.collections.includes(this.collection)) {
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
        (item: string | { url: string; localPath: string }) => {
          const url = typeof item === "string" ? item : item.url;
          const localPath =
            typeof item === "object" ? item.localPath : undefined;
          return {
            thumbnailUrl: url,
            reasonableSizeUrl: url,
            localPath,
            size: 0,
            type: "PNG",
            license: "CC-BY-SA",
            raw: {},
          } as IImage;
        }
      ),
    };
  }

  public aboutComponent(): JSX.Element {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const l10n = useL10n();
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
}
