import axios from "axios";
import { IImage, ISearchProvider, ISearchResult } from "./imageProvider";
import logo from "./europeana.png";
import { basePathPrefix, port } from "../../common/locations";

export class Europeana implements ISearchProvider {
  private apiKey: string | undefined;
  public label = "Europeana";
  public id = "europeana";
  public logo = logo;
  public isReady: boolean = false;
  private resultsLeftForPreviousQuery?: number;
  private previousQuery?: string;

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
        error: "Could not get a Europeana API key",
      };
    }

    // Reset page count if search term changed
    if (this.previousQuery !== searchTerm) {
      this.resultsLeftForPreviousQuery = undefined;
      this.previousQuery = searchTerm;
    }

    // Don't request beyond known results if we have that info
    if (this.resultsLeftForPreviousQuery == 0) {
      return {
        images: [],
      };
    }

    try {
      // enhance: "Open" limits to CC0, CC BY, CC BY-SA. It includes "PDM" which Bloom wouldn't understand (but should).
      // If we used "restricted" then we get CC BY-ND and all the NC ones. It also includes sever
      // Bloom doesn't understand, InC-EDU, NoC-NC, NoC-OKLR.
      const reusability = "open";
      const rowsPerPage = 20;
      const response = await axios.get<EuropeanaResponse>(
        `https://api.europeana.eu/api/v2/search.json?wskey=${
          this.apiKey
        }&query=${encodeURIComponent(
          searchTerm
        )}&media=true&qf=TYPE:IMAGE&profile=minimal&reusability=${reusability}` +
          `&rows=${rowsPerPage}&start=${pageZeroIndexed * rowsPerPage + 1}`
      );

      this.resultsLeftForPreviousQuery =
        response.data.totalResults - response.data.itemsCount;

      return {
        images: response.data.items
          .filter((item) => item.edmIsShownBy)
          .map(
            (item) =>
              ({
                thumbnailUrl: item.edmPreview,
                reasonableSizeUrl: item.edmIsShownBy,
                sourceWebPage: item.edmIsShownAt,
                size: 0,
                type: "image/*",
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
    if (!this.apiKey) {
      try {
        const response = await axios.get(
          `http://localhost:${port}${basePathPrefix}/api-key/europeana`
        );
        this.apiKey = response.data.key;
        // if we didn't get one
        if (this.apiKey) {
          this.isReady = true; //"https://pro.europeana.eu/page/get-api";
        }
      } catch (error) {
        // console already shows the error
      }
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
  edmIsShownAt: string | undefined;
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
