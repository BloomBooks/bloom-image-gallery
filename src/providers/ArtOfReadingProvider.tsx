import axios from "axios";
import {
  IImage,
  IImageCollectionProvider,
  ISearchResult,
  ProviderSummary,
  StandardDisclaimer,
} from "./imageProvider";
import logo from "./aor.png"; // at this point if we had collections other than Art of Reading, they will all get this same logo
import React from "react";
import { basePathPrefix, port } from "../../common/locations";

export class ArtOfReadingProvider implements IImageCollectionProvider {
  public label = "Art of Reading";
  public id = "aor";
  public logo = logo;
  public isReady = false;
  public local = true;

  private collection = "Art Of Reading";

  public async checkReadiness() {
    axios
      .get(
        `http://localhost:${port}${basePathPrefix}/local-collections/collections`
      )
      .then((response) => {
        if (response.data.collections.includes(this.collection)) {
          this.isReady = true;
        }
      });
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
            license: "CC-BY", // TODO? which is it?
            raw: {},
          }) as IImage
      ),
    };
  }

  public aboutComponent(): JSX.Element {
    return (
      <>
        <ProviderSummary>Something about art of reading</ProviderSummary>
      </>
    );
  }
}
