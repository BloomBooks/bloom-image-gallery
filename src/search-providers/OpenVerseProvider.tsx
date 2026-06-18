import axios from "axios";
import {
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
export class OpenVerse implements ISearchProvider {
  public label = "OpenVerse";
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
              thumbnailUrl: result.thumbnail,
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
      return {
        images: [],
        error: "Failed to fetch images from OpenVerse",
      };
    }
  }

  public aboutComponent(): JSX.Element {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const l10n = useL10n();
    return (
      <>
        <ProviderSummary title={l10n("ImageLibrary.AboutOpenVerse", "About OpenVerse")}>
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
