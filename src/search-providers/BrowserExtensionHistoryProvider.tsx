import axios from "axios";
import React from "react";
import { Alert } from "@mui/material";
import {
  ISearchProvider,
  ISearchResult,
  IImage,
  ProviderSummary,
} from "./imageProvider";
import logo from "./chrome.png";
import { BloomMediaMetadata } from "../../common/bloomMediaMetadata";
import { basePathPrefix, port } from "../../common/locations";
import { WikiCommonsMediaProvider } from "../metadata-providers/WikiCommons-metadata-provider";

// NB: must match what the Bloom Helper extension is sending us
type DownloadMetadata = {
  urlOfPage: string;
  url: string;
  savedAtPath: string;
  when: Date;
};

export class BrowserExtensionQueueProvider implements ISearchProvider {
  readonly label = "Browser Downloads";
  readonly id = "browser-downloads";
  readonly local = false;
  readonly justAListNoQuery = true;
  readonly logo = logo;
  readonly isReady = true; // todo: set to false until we hear from the extension?

  aboutComponent(): JSX.Element {
    return (
      <ProviderSummary>
        This area shows images saved by the Bloom Helper browser extension. When
        the extension is active, it keeps track of the images you download from
        websites (like Pixabay). It also saves important details, like the
        creator’s name and the license information. When you’re ready to add
        images to your book, come back here to find and use them.
      </ProviderSummary>
    );
  }

  async search(
    searchTerm: string,
    pageZeroIndexed: number,
    language: string
  ): Promise<ISearchResult> {
    try {
      const response = await axios.get(
        `http://localhost:${port}${basePathPrefix}/getDownloads`
      );
      console.log(
        "BloomChromeExtensionProvider search response",
        response.data
      );

      const downloads = (response.data as DownloadMetadata[]) || [];

      const provider = new WikiCommonsMediaProvider();

      const images = await Promise.all(
        downloads.map(async (download: DownloadMetadata) => {
          const metadata = await provider.getMetadata(
            download.urlOfPage,
            download.url
          );
          return {
            thumbnailUrl: download.url,
            reasonableSizeUrl: download.url,
            size: 0,
            type: "image/jpeg", // todo
            width: 0,
            height: 0,
            raw: metadata,
            license: metadata?.license,
            licenseUrl: metadata?.licenseUrl,
            creator: metadata?.credits,
            creatorUrl: metadata?.credits,
            sourceWebPage: download.urlOfPage,
          };
        })
      );

      return { images };
    } catch (error) {
      return {
        images: [],
        error: "Failed to fetch downloads",
      };
    }
  }
}
