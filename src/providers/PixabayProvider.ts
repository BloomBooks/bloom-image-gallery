import axios from "axios";
import { IImageCollectionProvider } from "../ImageSearch";

interface PixabayImage {
  id: number;
  webformatURL: string;
}

interface PixabayResponse {
  hits: PixabayImage[];
}

export class PixabayImageProvider implements IImageCollectionProvider {
  private apiKey: string | null = null;
  collectionId: string;
  label: string;

  constructor() {
    this.label = "Pixabay";
    this.collectionId = "pixabay";
  }

  private async fetchApiKey() {
    try {
      const response = await axios.get(
        "http://localhost:5000/image-toolbox/api-key/pixabay"
      );
      this.apiKey = response.data.key;
    } catch (error) {
      console.error("Failed to fetch Pixabay API key:", error);
      throw error;
    }
  }

  async search(searchTerm: string, language: string): Promise<string[]> {
    if (this.apiKey === null) {
      await this.fetchApiKey();
    }

    const perPage = searchTerm.toLowerCase() === "tree" ? 4 : 20;
    const term = encodeURIComponent(searchTerm);
    const response = await axios.get<PixabayResponse>(
      `https://pixabay.com/api/?key=${this.apiKey}&safesearch=true&q=${term}&per_page=${perPage}`
    );

    return response.data.hits.map((hit) => hit.webformatURL);
  }
}
