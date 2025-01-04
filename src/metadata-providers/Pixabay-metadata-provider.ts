import { MetadataProvider, getStandardizedLicense } from "./metadata-provider";
import { BloomMetadata } from "./bloomMediaMetadata";
import { PixabayImage } from "../search-providers/PixabayProvider";
import axios from "axios";
import { IImage } from "../search-providers/imageProvider";

export class PixabayMetadataProvider implements MetadataProvider {
  public canHandleDownload(url: string): boolean {
    return url.includes("pixabay.com");
  }

  public getHostWildcardPatterns(): string[] {
    return ["https://*.pixabay.com/*"];
  }

  private extractImageId(url: string): string | null {
    // Handle URLs like https://pixabay.com/illustrations/something-123456/
    const match = url.match(/pixabay\.com\/[^/]+\/[^-]+-(\d+)/);
    return match ? match[1] : null;
  }

  private async fetchImageDetails(
    imageId: string
  ): Promise<PixabayImage | null> {
    const key = localStorage.getItem("pixabayApiKey");
    if (!key) return null;

    try {
      const response = await axios.get<{ hits: PixabayImage[] }>(
        `https://pixabay.com/api/?key=${key}&id=${imageId}`
      );
      return response.data.hits[0] || null;
    } catch (error) {
      console.error("Failed to fetch Pixabay image details:", error);
      return null;
    }
  }

  public async getMetadata(
    sourcePageUrl: string,
    imageUrl: string
  ): Promise<IImage | undefined> {
    const license = getStandardizedLicense(
      "Site Specific",
      "https://pixabay.com/service/license/"
    );
    if (!license) return undefined;

    const imageId = this.extractImageId(sourcePageUrl);
    if (!imageId) return undefined;

    // the path portion of the url ends in underscore and then the height and then the extension, e.g. https://pixabay.com/images/download/bus-8142339_640.jpg?attachment=..."
    // let's match on "download/<name>-<id>_<width>.<ext>"
    let height = 0;
    let width = 0;
    const match = imageUrl.match(
      /download\/[^-]+-(\d+)_\d+\.(jpg|jpeg|png|gif)/
    );
    const imageDetails = await this.fetchImageDetails(imageId);
    if (match) {
      height = parseInt(match[1]);
      // we aren't give then width of what they actually downloaded, but we can assume it is the same aspect ratio as what the metadata lists
      if (imageDetails && imageDetails.webformatHeight > 0) {
        const aspectRatio =
          imageDetails.webformatWidth / imageDetails.webformatHeight;
        width = Math.round(height * aspectRatio);
      }
    }

    if (!imageDetails) return undefined;

    return {
      url: imageUrl,
      reasonableSizeUrl: imageUrl,
      thumbnailUrl: imageUrl, // review: alternatively, we could use the local file
      ...license,
      sourceWebPage: sourcePageUrl,
      width: width,
      height: height,
      size: imageDetails.size,
      credits:
        `Pixabay ${imageDetails.user ? " / " + imageDetails.user : ""}`.trim(),
      type: "image/jpeg", // TODO
    };
  }
}
