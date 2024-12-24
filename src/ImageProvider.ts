import axios from "axios";

export interface IImageProvider {
  search(searchTerm: string, language: string): Promise<string[]>;
}

export class CollectionImageProvider implements IImageProvider {
  constructor(private collection: string) {}

  async search(searchTerm: string, language: string): Promise<string[]> {
    const response = await axios.get(
      `http://localhost:5000/image-toolbox/search/${this.collection.replaceAll(
        " ",
        "%20"
      )}/${language}/${searchTerm.replaceAll(" ", "%20")}`
    );
    // Map the response to include the collection name in each path
    return (response.data as string[]).map(
      (path) => `${this.collection}/${path}`
    );
  }
}
