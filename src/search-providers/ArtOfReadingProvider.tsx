import axios from "axios";
import {
  IImage,
  ISearchProvider,
  ISearchResult,
  ProviderSummary,
  StandardDisclaimer,
} from "./imageProvider";
import logo from "./aor.png"; // at this point if we had collections other than Art of Reading, they will all get this same logo
import React from "react";
import { basePathPrefix, port } from "../../common/locations";
import { Alert } from "@mui/material";

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

  public async checkReadiness() {
    try {
      const response = await axios.get(
        `http://localhost:${port}${basePathPrefix}/local-collections/collections`
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
    const response = await axios.get(
      `http://localhost:${port}${basePathPrefix}/local-collections/search/${encodeURIComponent(
        this.collection
      )}/${language}/${encodeURIComponent(searchTerm)}`
    );
    return {
      images: response.data.map(
        (url: string) =>
          ({
            thumbnailUrl: url,
            reasonableSizeUrl: url,
            size: 0,
            type: "PNG",
            license: "CC-BY-SA",
            raw: {},
          }) as IImage
      ),
    };
  }

  public aboutComponent(): JSX.Element {
    return (
      <>
        <ProviderSummary title="About Art of Reading">
          International Illustrations: Art of Reading 3.0 is a collection of
          over 11,000 images. The collection is designed for use in the
          preparation of a wide variety of literacy and educational materials,
          such as shellbooks, primers, news-sheets, posters, and other
          culturally appropriate materials. These images are black and white
          line drawings collected from SIL and national artists from around the
          world.
        </ProviderSummary>
        {!this.isReady && (
          <Alert severity="info">
            To get Art of Reading images, you need to:
            <ol>
              <li>
                Download and install the{" "}
                <a
                  href="https://bloomlibrary.org/page/resources/art-of-reading"
                  target="_blank"
                  rel="noreferrer"
                >
                  Art of Reading Installer
                </a>
              </li>
              <li>Quit and re-run Bloom</li>
            </ol>
          </Alert>
        )}
      </>
    );
  }
}
