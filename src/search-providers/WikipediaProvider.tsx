import axios from "axios";
import {
  IImage,
  ISearchProvider,
  ISearchResult,
  ProviderSummary,
  StandardDisclaimer,
} from "./imageProvider";
import logo from "./WikiCommons.png";
import React from "react";
interface WikiImageInfo {
  descriptionurl: string;
  url: string;
  thumburl?: string;
  width: number;
  height: number;
  extmetadata?: {
    Artist?: {
      value: string;
    };
    License?: {
      value: string;
    };
    LicenseShortName?: {
      value: string;
    };
  };
}

interface WikiResponse {
  continue?: {
    gsroffset: number;
    continue: string;
  };
  query?: {
    pages?: {
      [key: string]: {
        imageinfo?: WikiImageInfo[];
        title?: string;
      };
    };
  };
}

export class WikipediaProvider implements ISearchProvider {
  public label = "Wikimedia Commons";
  public id = "wikipedia";
  public logo = logo;
  public isReady = true;

  // Wikipedia doesn't have normal paging, so we need these two
  private continueToken: string | undefined;
  private previousQuery: string | undefined; // this is needed to know when we need to reset the continueToken

  public async search(
    searchTerm: string,
    pageZeroIndexed: number,
    language: string
  ): Promise<ISearchResult> {
    try {
      // if we're searching the same thing but the last result had no continueToken, we are done searching
      if (searchTerm === this.previousQuery && !this.continueToken) {
        return { images: [] };
      }

      if (searchTerm !== this.previousQuery) {
        this.continueToken = undefined;
        this.previousQuery = searchTerm;
      }
      const term = encodeURIComponent(searchTerm);
      const limit = 20;
      const continuePart = this.continueToken
        ? `&continue=${this.continueToken}&gsroffset=${pageZeroIndexed * limit}`
        : "";

      const response = await axios.get<WikiResponse>(
        `https://commons.wikimedia.org/w/api.php?action=query` +
          `&generator=search` +
          `&gsrsearch="${term}"` +
          `&gsrnamespace=6` +
          `&prop=imageinfo` +
          `&iiprop=url|extmetadata|mime|size` +
          `&iiurlwidth=300` +
          `&format=json&origin=*` +
          `&gsrlimit=${limit}` +
          continuePart
      );

      this.continueToken = response.data.continue?.continue;
      const pages = response.data.query?.pages || {};
      const images: IImage[] = [];

      Object.values(pages).forEach((page) => {
        if (page.imageinfo?.[0]) {
          const info = page.imageinfo[0];
          const artist =
            info.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, "") || // Remove HTML tags
            undefined;

          images.push({
            thumbnailUrl: info.thumburl || info.url,
            reasonableSizeUrl: info.url,
            sourceWebPage: info.descriptionurl,
            size: 0,
            type: "image",
            width: info.width,
            height: info.height,
            license:
              info.extmetadata?.LicenseShortName?.value ||
              info.extmetadata?.License?.value ||
              "Wikimedia Commons",
            licenseUrl: "https://commons.wikimedia.org/wiki/Commons:Licensing",
            creator: artist,
            raw: info,
          });
        }
      });

      return { images };
    } catch (error) {
      return {
        images: [],
        error: `Error fetching from Wikimedia: ${error}`,
      };
    }
  }

  public aboutComponent(): JSX.Element {
    return (
      <>
        <ProviderSummary>
          Wikimedia Commons is a collection of media that is free to use. The
          OpenVerse search also includes results from Wikimedia Commons.
        </ProviderSummary>
        <br />
        <StandardDisclaimer />
      </>
    );
  }
}
