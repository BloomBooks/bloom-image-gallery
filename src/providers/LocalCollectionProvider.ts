import axios from "axios";
import { useEffect } from "react";
import { IImageCollectionProvider } from "../ImageSearch";
import { IImageProvider } from "./provider";

export function useLocalCollections(collections: IImageProvider[]) {
  useEffect(() => {
    axios
      .get(`http://localhost:5000/image-toolbox/local-collections/collections`)
      .then((response) => {
        const localCollections: Array<IImageProvider> =
          response.data.collections.map((c: any) => {
            return {
              label: c,
              id: c,
              // TODO: as though all local collections will have the same set of languages
              languages: response.data.languages,
            };
          });
        // push the local collections onto the imageCollections state, prevent duplicates
        collections.push(
          ...localCollections.filter(
            (c) => !collections.find((p) => p.id === c.id)
          )
        );
      })
      .catch((reason) => {
        console.log(
          `axios call image-toolbox/local-collections/collections failed: ${reason}`
        );
      });
  }, []);
}

export class LocalCollectionProvider implements IImageCollectionProvider {
  collectionId: string;
  label: string;
  constructor(label: string, collectionId: string) {
    this.label = label;
    this.collectionId = collectionId;
  }

  async search(searchTerm: string, language: string): Promise<string[]> {
    const response = await axios.get(
      `http://localhost:5000/image-toolbox/local-collections/search/${this.collectionId.replaceAll(
        " ",
        "%20"
      )}/${language}/${searchTerm.replaceAll(" ", "%20")}`
    );
    // Map the response to include the collection name in each path
    return (response.data as string[]).map(
      (path) =>
        `http://localhost:5000/image-toolbox/local-collections/collection-image-file/${this.collectionId}/${path}`
    );
  }
}
