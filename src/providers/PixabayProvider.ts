import axios from "axios";
import logo from "./pixabay.png";
import {
  IImage,
  IImageCollectionProvider,
  ISearchResult,
} from "./imageProvider";

export class Pixabay implements IImageCollectionProvider {
  private apiKey: string | undefined;
  public label = "Pixabay";
  public id = "pixabay";
  public logo = logo;
  public needsApiUrl?: string;
  private totalHits: number = 0;

  public async checkReadiness() {
    await this.fetchApiKey();
    return this;
  }

  public async search(
    searchTerm: string,
    pageZeroIndexed: number,
    language: string
  ): Promise<ISearchResult> {
    if (!this.apiKey) {
      return {
        images: [],
        error: "Could not get a Pixabay API key",
      };
    }

    const perPage = 20;
    // Check if we've already received all available results
    if (this.totalHits > 0 && pageZeroIndexed * perPage >= this.totalHits) {
      return { images: [] };
    }

    const term = encodeURIComponent(searchTerm);
    const imageType = "illustration";
    const response = await axios.get<PixabayResponse>(
      `https://pixabay.com/api/?key=${this.apiKey}&safesearch=true&q=${term}` +
        `&page=${pageZeroIndexed + 1}&per_page=${perPage}` +
        `&image_type=${imageType}`
    );

    // Store the total hits for pagination
    this.totalHits = response.data.totalHits;

    return {
      images: response.data.hits.map(
        (hit: PixabayImage) =>
          ({
            thumbnailUrl: hit.previewURL,
            // review: we have at least 3 premade sizes and can get a custom size too
            reasonableSizeUrl: hit.webformatURL, // note: with the hit.webformatURL, we can actually request a smaller image if we knew that HD is overkill
            webSiteUrl: hit.pageURL,
            size: 0,
            type: "?",
            width: hit.webformatWidth,
            height: hit.webformatHeight,
            license: "Pixabay License",
            licenseUrl: "https://pixabay.com/service/license/",
            raw: hit,
          }) as IImage
      ),
    };
  }

  private async fetchApiKey() {
    try {
      const response = await axios.get(
        "http://localhost:5000/image-toolbox/api-key/pixabay"
      );
      this.apiKey = response.data.key;
      // if we didn't get one
      if (!this.apiKey) {
        this.needsApiUrl = "https://pixabay.com/api/docs/";
      }
    } catch (error) {
      console.error("Failed to fetch Pixabay API key:", error);
      throw error;
    }
  }
}

interface PixabayImage {
  id: number;
  previewURL: string; // 	Low resolution images with a maximum width or height of 150 px (previewWidth x previewHeight).

  /* Medium sized image with a maximum width or height of 640 px (webformatWidth x webformatHeight). URL valid for 24 hours.
    Replace '_640' in any webformatURL value to access other image sizes:
    Replace with '_180' or '_340' to get a 180 or 340 px tall version of the image, respectively. Replace with '_960' to get the image in a maximum dimension of 960 x 720 px.
  */
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;

  largeImageURL: string; // Scaled image with a maximum width/height of 1280px.

  pageURL: string; // URL to the page on Pixabay, where the image can be found.

  // only available if your account has been approved for full API access
  // fullHDURL	Full HD scaled image with a maximum width/height of 1920px.
  fullHDURL: string;

  // pixabay also offers original image if your account has been approved for full API access
}

interface PixabayResponse {
  totalHits: number; // how many we can get from this API
  hits: PixabayImage[];
}
