import axios from "axios";
import React from "react";
import {
  IImage,
  ISearchProvider,
  ISearchResult,
  ProviderSummary,
} from "./imageProvider";
import logo from "./chrome.png";
import { basePathPrefix, port } from "../../common/locations";
import { WikiCommonsMediaProvider } from "../metadata-providers/WikiCommons-metadata-provider";
import { PixabayMetadataProvider } from "../metadata-providers/Pixabay-metadata-provider";
import { getStandardizedLicense } from "../metadata-providers/metadata-provider";
import { DownloadRecord } from "../../common/bloomMediaMetadata";

export class BrowserExtensionQueueProvider implements ISearchProvider {
  private providers = [
    new WikiCommonsMediaProvider(),
    new PixabayMetadataProvider(),
  ];

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

      const downloads = (response.data as DownloadRecord[]) || [];

      const images = await Promise.all(
        downloads.map(async (download: DownloadRecord) => {
          const provider = this.providers.find((p) =>
            p.canHandleDownload(download.urlOfPage)
          );

          // enhance: this is going to do internet requests for each image when we don't really need that
          // metadata yet. We really only need it when the user clicks on a particular thumbnail. But this
          // would require changing <ImageDetails> to ask a provider for metadata when it needs it.
          const metadata = provider
            ? await provider.getMetadata(download.urlOfPage, download.url)
            : undefined;

          const standardLicense = metadata?.license
            ? getStandardizedLicense(metadata?.license, metadata?.licenseUrl)
            : undefined;

          const info: IImage = {
            url: `http://localhost:${port}${basePathPrefix}/localFile?path=${encodeURIComponent(download.computedLocalSavedPath)}`,
            thumbnailUrl: `http://localhost:${port}${basePathPrefix}/localFile?path=${encodeURIComponent(download.computedLocalSavedPath)}`,
            reasonableSizeUrl: `http://localhost:${port}${basePathPrefix}/localFile?path=${encodeURIComponent(download.computedLocalSavedPath)}`,
            ...standardLicense,
            credits: metadata?.credits,
            size: 0,
            type: "image/jpeg", // todo
            width: 0,
            height: 0,
            sourceWebPage: download.urlOfPage,
            raw: metadata,
          };
          console.log(
            "metadata for a stored download:",
            JSON.stringify(info, null, 2)
          );
          return info;
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
