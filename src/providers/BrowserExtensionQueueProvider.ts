import axios from "axios";
import {
  IImageCollectionProvider,
  ISearchResult,
  IImage,
} from "./imageProvider";
import logo from "./chrome.png";
import { BloomMediaMetadata } from "../../common/bloomMediaMetadata";
import { basePathPrefix, port } from "../../common/locations";

export class BrowserExtensionQueueProvider implements IImageCollectionProvider {
  label = "Browser Queue";
  id = "browser-queue";
  local = true;
  justAListNoQuery = true;
  logo = logo;

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
