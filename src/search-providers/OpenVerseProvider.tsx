import axios from "axios";
import {
  failedSearch,
  IImage,
  ISearchProvider,
  ISearchResult,
  ProviderSummary,
  StandardDisclaimer,
} from "./imageProvider";
import logo from "./openverse.png?inline";
import { Alert } from "@mui/material";
import React from "react";
import { useL10n } from "../localization";

// Wikimedia only serves thumbnails at a set of standard widths; 330 is the one closest to our tiles.
const kWikimediaThumbnailWidth = 330;

// Openverse's thumbnail proxy usually fails (500 after a long wait) for images hosted on
// Wikimedia Commons (BL-17045), so for those we ask Wikimedia for a thumbnail directly.
// Returns undefined when we can't safely build one, so the caller can fall back.
export function getWikimediaThumbnailUrl(
  imageUrl: string,
  imageWidth: number | undefined
): string | undefined {
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:" || url.hostname !== "upload.wikimedia.org")
    return undefined;
  // e.g. /wikipedia/commons/a/a1/Podarcis_muralis_11.jpg
  // Only the path matters: Openverse sometimes adds tracking parameters (?utm_source=...).
  const match = url.pathname.match(
    /^(\/wikipedia\/[^/]+)\/([0-9a-f]\/[0-9a-f]{2}\/([^/]+\.(jpe?g|png|gif|webp|svg)))$/i
  );
  if (!match || !imageWidth) return undefined;
  const [, project, path, fileName, extension] = match;
  const base = `https://upload.wikimedia.org${project}`;
  const isSvg = extension.toLowerCase() === "svg";
  // Wikimedia refuses to scale a raster image up, and a small image makes a fine thumbnail anyway.
  if (!isSvg && imageWidth <= kWikimediaThumbnailWidth) return imageUrl;
  // e.g. .../commons/thumb/a/a1/Podarcis_muralis_11.jpg/330px-Podarcis_muralis_11.jpg
  // (an SVG's thumbnail is a PNG: .../330px-Name.svg.png)
  return `${base}/thumb/${path}/${kWikimediaThumbnailWidth}px-${fileName}${isSvg ? ".png" : ""}`;
}

export class OpenVerse implements ISearchProvider {
  public label = "Openverse";
  public id = "openverse";
  public logo = logo;
  public isReady = true;
  private pageCountForPreviousQuery?: number;
  private previousQuery?: string;

  // e.g. "View on www.flickr.com", derived from the landing page's host.
  private formatSourceLabel(result: OpenVerseImage): string {
    const url = result.foreign_landing_url || result.url;
    if (url) {
      try {
        return `View on ${new URL(url).hostname}`;
      } catch {
        // fall through to a sensible default below
      }
    }
    return result.source ? `View on ${result.source}` : "Source";
  }

  private formatLicense(license: string): string {
    if (license.match(/^(by|by-sa|by-nd|by-nc|by-nc-sa|by-nc-nd)$/)) {
      return `CC-${license.toUpperCase()}`;
    }
    return license;
  }

  public async search(
    searchTerm: string,
    pageZeroIndexed: number,
    language: string
  ): Promise<ISearchResult> {
    // Reset page count if search term changed
    if (this.previousQuery !== searchTerm) {
      this.pageCountForPreviousQuery = undefined;
      this.previousQuery = searchTerm;
    }

    // Don't request beyond known pages if we have that info
    if (
      this.pageCountForPreviousQuery &&
      pageZeroIndexed >= this.pageCountForPreviousQuery
    ) {
      return {
        images: [],
      };
    }

    try {
      const response = await axios.get<OpenVerseResponse>(
        `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
          searchTerm
        )}` +
          //`&mature=false` + // Actually in Jan 2025 this gives more mature results than not mentioning it
          `&page_size=20&page=${pageZeroIndexed + 1}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      // Store the page count for future reference
      this.pageCountForPreviousQuery = response.data.page_count;

      return {
        totalImages: response.data.result_count,
        images: response.data.results.map(
          (result: OpenVerseImage) =>
            ({
              thumbnailUrl:
                getWikimediaThumbnailUrl(result.url, result.width) ??
                result.thumbnail,
              url: result.url,
              reasonableSizeUrl: result.url,
              size: 0,
              type: result.mime_type,
              width: result.width,
              height: result.height,
              license: this.formatLicense(result.license),
              licenseUrl: result.license_url,
              credits: result.creator, // creator is the copyright holder for CC-licensed work
              creator: result.creator,
              creatorUrl: result.creator_url,
              sourceWebPage: result.foreign_landing_url,
              sourceWebPageLabel: this.formatSourceLabel(result),
              raw: result,
            }) as IImage
        ),
      };
    } catch (error) {
      console.error("OpenVerse search failed:", error);
      return failedSearch("Openverse", error);
    }
  }

  public aboutComponent(): JSX.Element {
    const l10n = useL10n();
    return (
      <>
        <ProviderSummary title={l10n("ImageLibrary.AboutOpenVerse", "About Openverse")}>
          {l10n("ImageLibrary.OpenVerseDescription", "Openverse searches multiple public repositories for CC-licensed and public domain works.")}{" "}
          <a href="https://openverse.org/about">{l10n("ImageLibrary.MoreInfo", "More info")}</a>
        </ProviderSummary>
        <StandardDisclaimer />
      </>
    );
  }
}

interface OpenVerseImage {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  creator: string;
  creator_url: string;
  foreign_landing_url: string;
  source: string; // e.g. "flickr"
  license: string;
  license_url: string;
  mime_type: string;
  width: number;
  height: number;
}

interface OpenVerseResponse {
  result_count: number;
  results: OpenVerseImage[];
  page: number;
  page_count: number;
  page_size: number;
  total_results: number;
}
