import axios from "axios";
import {
  IImage,
  IImageCollectionProvider,
  ISearchResult,
} from "./imageProvider";
import logo from "./WikiCommons.png";
interface WikiImageInfo {
  descriptionurl: string;
  url: string;
  thumburl?: string;
  width: number;
  height: number;
  extmetadata?: {
    Artist?: {
      value: string;
    };
  };
}

interface WikiResponse {
  query?: {
    pages?: {
      [key: string]: {
        imageinfo?: WikiImageInfo[];
        title?: string;
      };
    };
  };
}

export class WikipediaProvider implements IImageCollectionProvider {
  public label = "Wikimedia Commons";
  public id = "wikipedia";
  public logo = logo;
  public async search(
    searchTerm: string,
    language: string
  ): Promise<ISearchResult> {
    try {
      const term = encodeURIComponent(searchTerm);
      const response = await axios.get<WikiResponse>(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=images&iiprop=url|thumburl|size|extmetadata` +
          //`&meta`+ // doesn't seem to do anything
          `&prop=imageinfo` +
          //`&iiprop=extmetadata` +
          `&iiurlwidth=300&gimlimit=20&format=json&origin=*&titles=${term}`
      );

      const pages = response.data.query?.pages || {};
      const images: IImage[] = [];

      Object.values(pages).forEach((page) => {
        if (page.imageinfo?.[0]) {
          const info = page.imageinfo[0];
          const artist =
            info.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, "") || // Remove HTML tags
            undefined;

          images.push({
            thumbnailUrl: info.thumburl || info.url,
            reasonableSizeUrl: info.url,
            webSiteUrl: info.descriptionurl,
            size: 0,
            type: "image",
            width: info.width,
            height: info.height,
            license: "Wikimedia Commons",
            licenseUrl: "https://commons.wikimedia.org/wiki/Commons:Licensing",
            creator: artist,
            raw: info,
          });
        }
      });

      return { images };
    } catch (error) {
      return {
        images: [],
        error: `Error fetching from Wikimedia: ${error}`,
      };
    }
  }
}
