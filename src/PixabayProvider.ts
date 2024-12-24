import axios from "axios";
import { IImageCollectionProvider } from "./ImageProvider";

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
        "http://localhost:5000/image-toolbox/pixabay-key"
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

    const response = await axios.get<PixabayResponse>(
      `https://pixabay.com/api/?key=${this.apiKey}&q=${encodeURIComponent(
        searchTerm
      )}`
    );

    return response.data.hits.map((hit) => hit.webformatURL);
  }
}
