import axios from "axios";
import {
  IImage,
  IImageCollectionProvider,
  ISearchResult,
} from "./imageProvider";

export class OpenVerse implements IImageCollectionProvider {
  public label = "OpenVerse";
  public id = "openverse";

  private formatLicense(license: string): string {
    if (license.match(/^(by|by-sa|by-nd|by-nc|by-nc-sa|by-nc-nd)$/)) {
      return `CC-${license.toUpperCase()}`;
    }
    return license;
  }

  public async search(
    searchTerm: string,
    language: string
  ): Promise<ISearchResult> {
    try {
      const response = await axios.get<OpenVerseResponse>(
        // enhance: this allows things like https://openverse.org/search/?q=baby+shoes&license_type=commercial,modification

        `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
          searchTerm
        )}&page_size=20`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      return {
        images: response.data.results.map(
          (result: OpenVerseImage) =>
            ({
              thumbnailUrl: result.thumbnail,
              reasonableSizeUrl: result.url,
              size: 0,
              type: result.mime_type,
              width: result.width,
              height: result.height,
              license: this.formatLicense(result.license),
              licenseUrl: result.license_url,
              creator: result.creator,
              creatorUrl: result.creator_url,
              raw: result,
            }) as IImage
        ),
      };
    } catch (error) {
      console.error("OpenVerse search failed:", error);
      return {
        images: [],
        error: "Failed to fetch images from OpenVerse",
      };
    }
  }
}

interface OpenVerseImage {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  creator: string;
  creator_url: string;
  license: string;
  license_url: string;
  mime_type: string;
  width: number;
  height: number;
}

interface OpenVerseResponse {
  results: OpenVerseImage[];
  page_count: number;
  page_size: number;
  total_results: number;
}
