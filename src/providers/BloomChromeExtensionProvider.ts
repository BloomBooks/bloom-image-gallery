import axios from "axios";
import {
  IImageCollectionProvider,
  ISearchResult,
  IImage,
} from "./imageProvider";

export class BloomChromeExtensionProvider implements IImageCollectionProvider {
  label = "Bloom Chrome Extension";
  id = "bloom-chrome-extension";
  local = true;

  async search(
    searchTerm: string,
    pageZeroIndexed: number,
    language: string
  ): Promise<ISearchResult> {
    try {
      const response = await axios.get(
        "http://localhost:5000/image-toolbox/getDownloads"
      );
      console.log(
        "BloomChromeExtensionProvider search response",
        response.data
      );
      const downloads = response.data || [];

      const images: IImage[] = downloads.map((download: any) => ({
        thumbnailUrl: download.url,
        reasonableSizeUrl: download.url,
        size: download.size || 0,
        type: download.type || "image/jpeg",
        width: download.width,
        height: download.height,
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
