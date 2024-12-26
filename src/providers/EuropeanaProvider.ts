import axios from "axios";
import {
  IImage,
  IImageCollectionProvider,
  ISearchResult,
} from "./imageProvider";

export class Europeana implements IImageCollectionProvider {
  private apiKey: string | undefined;
  public label = "Europeana";
  public id = "europeana";

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
      const response = await axios.get<EuropeanaResponse>(
        `https://api.europeana.eu/api/v2/search.json?wskey=${
          this.apiKey
        }&query=${encodeURIComponent(
          searchTerm
        )}&media=true&qf=TYPE:IMAGE&profile=rich&rows=20`
      );

      return {
        images: response.data.items
          .filter((item) => item.edmIsShownBy)
          .map(
            (item) =>
              ({
                thumbnailUrl: item.edmIsShownBy,
                reasonableSizeUrl: item.edmIsShownBy,
                size: 0,
                type: "image/*",
                width: 0,
                height: 0,
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
}

interface EuropeanaItem {
  id: string;
  title: string[];
  dcCreator?: string[];
  edmIsShownBy: string;
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
