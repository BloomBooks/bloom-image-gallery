import axios from "axios";
import React from "react";
import { Alert } from "@mui/material";
import {
  IImageCollectionProvider,
  ISearchResult,
  IImage,
} from "./imageProvider";
import logo from "./chrome.png";
import { BloomMediaMetadata } from "../../common/bloomMediaMetadata";
import { basePathPrefix, port } from "../../common/locations";

export class BrowserExtensionQueueProvider implements IImageCollectionProvider {
  readonly label = "Browser Queue";
  readonly id = "browser-queue";
  readonly local = false;
  readonly justAListNoQuery = true;
  readonly logo = logo;
  readonly isReady = true; // todo: set to false until we hear from the extension?

  aboutComponent(): JSX.Element {
    return (
      <Alert severity="info">
        This area shows images saved by the Bloom Helper browser extension. When
        the extension is active, it keeps track of the images you download from
        websites (like Pixabay). It also saves important details, like the
        creator’s name and the license information. When you’re ready to add
        images to your book, come back here to find and use them.
      </Alert>
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
      // the data is an array of BloomMediaMetadata
      const downloads = (response.data as BloomMediaMetadata[]) || [];

      const images: IImage[] = downloads.map((download: any) => ({
        thumbnailUrl: download.url,
        reasonableSizeUrl: download.url,
        size: download.size || 0,
        type: download.type || "image/jpeg", // todo
        width: download.width,
        height: download.height,
        raw: download,
        license: download.license,
        licenseUrl: download.licenseUrl,
        creator: download.creator,
        creatorUrl: download.creatorUrl,
        sourceWebPage: download.sourceWebPage,
      }));

      return { images };
    } catch (error) {
      return {
        images: [],
        error: "Failed to fetch downloads",
      };
    }
  }
}
