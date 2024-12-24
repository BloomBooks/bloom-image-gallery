import axios from "axios";

export interface IImageCollectionProvider {
  label: string;
  search(searchTerm: string, language: string): Promise<string[]>;
}

export class ImageCollectionProvider implements IImageCollectionProvider {
  collectionId: string;
  label: string;
  constructor(label: string, collectionId: string) {
    this.label = label;
    this.collectionId = collectionId;
  }

  async search(searchTerm: string, language: string): Promise<string[]> {
    const response = await axios.get(
      `http://localhost:5000/image-toolbox/search/${this.collectionId.replaceAll(
        " ",
        "%20"
      )}/${language}/${searchTerm.replaceAll(" ", "%20")}`
    );
    // Map the response to include the collection name in each path
    return (response.data as string[]).map(
      (path) =>
        `http://localhost:5000/image-toolbox/collection-image-file/${this.collectionId}/${path}`
    );
  }
}
