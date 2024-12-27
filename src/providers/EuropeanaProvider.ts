import axios from "axios";
import {
  IImage,
  IImageCollectionProvider,
  ISearchResult,
} from "./imageProvider";
import logo from "./europeana.png";

export class Europeana implements IImageCollectionProvider {
  private apiKey: string | undefined;
  public label = "Europeana";
  public id = "europeana";
  public logo = logo;

  public async search(
    searchTerm: string,
    language: string
  ): Promise<ISearchResult> {
    if (!this.apiKey) {
      await this.fetchApiKey();
    }
    if (!this.apiKey) {
      return {
        images: [],
        error: "Could not get a Europeana API key",
      };
    }

    try {
      // enhance: "Open" limits to CC0, CC BY, CC BY-SA. It includes "PDM" which Bloom wouldn't understand (but should).
      // If we used "restricted" then we get CC BY-ND and all the NC ones. It also includes sever
      // Bloom doesn't understand, InC-EDU, NoC-NC, NoC-OKLR.
      const reusability = "open";
      const response = await axios.get<EuropeanaResponse>(
        `https://api.europeana.eu/api/v2/search.json?wskey=${
          this.apiKey
        }&query=${encodeURIComponent(
          searchTerm
        )}&media=true&qf=TYPE:IMAGE&profile=minimal&reusability=${reusability}&rows=20`
      );

      return {
        images: response.data.items
          .filter((item) => item.edmIsShownBy)
          .map(
            (item) =>
              ({
                thumbnailUrl: item.edmPreview,
                reasonableSizeUrl: item.edmIsShownBy,
                size: 0,
                type: "image/*",
                width: 0,
                height: 0,
                creator: item.dcCreator ? item.dcCreator[0] : undefined,
                license: this.convertLicense(item.rights?.[0]),
                raw: item,
              }) as IImage
          ),
      };
    } catch (error) {
      console.error("Europeana search failed:", error);
      return {
        images: [],
        error: "Failed to fetch images from Europeana",
      };
    }
  }

  private async fetchApiKey() {
    try {
      const response = await axios.get(
        "http://localhost:5000/image-toolbox/api-key/europeana"
      );
      this.apiKey = response.data.key;
    } catch (error) {
      console.error("Failed to fetch Europeana API key:", error);
      throw error;
    }
  }

  private convertLicense(licenseUrl?: string): string | undefined {
    if (!licenseUrl) return undefined;

    if (licenseUrl.includes("publicdomain")) {
      return "Public Domain";
    }

    const ccMatch = licenseUrl.match(
      /creativecommons\.org\/licenses\/((?:by|sa|nc|nd)(?:-(?:sa|nc|nd))*)/i
    );
    if (!ccMatch) return licenseUrl;

    return "CC-" + ccMatch[1].toUpperCase();
  }
}

interface EuropeanaItem {
  id: string;
  title: string[];
  dcCreator?: string[];
  edmIsShownBy: string;
  edmPreview: string;
  dcDescription?: string[];
  dataProvider: string[];
  rights: string[];
}

interface EuropeanaResponse {
  success: boolean;
  items: EuropeanaItem[];
  itemsCount: number;
  totalResults: number;
}
