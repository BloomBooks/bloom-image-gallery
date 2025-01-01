import axios from "axios";
import { useEffect } from "react";
import { port, basePathPrefix } from "../../common/locations";
import {
  IImageCollectionProvider,
  ISearchResult,
  IImage,
} from "./imageProvider";
import logo from "./aor.png"; // at this point if we had collections other than Art of Reading, they will all get this same logo

export function useLocalCollections(
  add: (provider: IImageCollectionProvider) => void
) {
  useEffect(() => {
    axios
      .get(
        `http://localhost:${port}${basePathPrefix}/local-collections/collections`
      )
      .then((response) => {
        response.data.collections.forEach((name) => {
          add({
            label: name,
            local: true,
            id: name,
            languages: response.data.languages,
            search: async (
              searchTerm: string,
              page: number,
              language: string
            ) => await search(name, searchTerm, language),
            logo: logo,
          });
        });
      })
      .catch((reason) => {
        console.log(
          `axios call local-collections/collections failed: ${reason}`
        );
      });
  }, [add]);
}

async function search(
  collection: string,
  searchTerm: string,
  language: string
): Promise<ISearchResult> {
  const response = await axios.get(
    `http://localhost:${port}${basePathPrefix}/local-collections/search/${collection.replaceAll(
      " ",
      "%20"
    )}/${language}/${searchTerm.replaceAll(" ", "%20")}`
  );
  return {
    images: response.data.map(
      (url: string) =>
        ({
          thumbnailUrl: url,
          reasonableSizeUrl: url,
          size: 0,
          type: "?",
        }) as IImage
    ),
  };
}

public aboutComponent(): JSX.Element {
    return (
      <>
        <ProviderSummary>
          Something about the Art of Reading collection.
        </ProviderSummary>
       
      </>
    );
  }