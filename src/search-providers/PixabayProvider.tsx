import axios from "axios";
import logo from "./pixabay.png?inline";
import {
  failedSearch,
  IImage,
  ISearchProvider,
  ISearchResult,
  ProviderSummary,
  StandardDisclaimer,
} from "./imageProvider";
import { Alert, IconButton, InputAdornment, TextField } from "@mui/material";
import { ContentPaste as ContentPasteIcon } from "@mui/icons-material";
import React, { useState } from "react";
import { useLocalStorageString } from "./useLocalStorageString";
import { interpolateJsx, useL10n } from "../localization";

// We download largeImageURL, which Pixabay's API docs (https://pixabay.com/api/docs/)
// describe as scaled to a maximum width or height of 1280px. The search results only give
// the original's dimensions (imageWidth/imageHeight), not largeImageURL's, so we work out
// the downloaded copy's size from the original using this limit (see scaledToFit).
// If Pixabay changes the limit, update this value, or the sizes we show will be wrong.
// Ordinary API keys can't get anything bigger: imageURL and fullHDURL require accounts
// approved for full API access.
const kLargeImageMaxDimension = 1280;

// The size Pixabay serves an image at when it scales it so neither side exceeds
// maxDimension. It never enlarges a smaller image.
export function scaledToFit(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export class Pixabay implements ISearchProvider {
  public label = "Pixabay";
  public id = "pixabay";
  public logo = logo;
  private totalHits: number = 0;
  onReadyStateChange?: () => void;
  private readonly initialKey?: string;
  private readonly onKeyChange?: (key: string) => void;

  constructor(options?: { initialKey?: string; onKeyChange?: (key: string) => void }) {
    this.initialKey = options?.initialKey;
    this.onKeyChange = options?.onKeyChange;
    // Seed localStorage from the host-provided key only if it was never set (null).
    // If the user explicitly cleared it (empty string), respect that choice.
    if (options?.initialKey && localStorage.getItem("pixabayApiKey") === null) {
      localStorage.setItem("pixabayApiKey", options.initialKey);
    }
  }

  get isReady(): boolean {
    const stored = localStorage.getItem("pixabayApiKey");
    // null  = never set → fall back to host-provided key
    // ""    = deliberately cleared by user → treat as not ready
    return stored === null ? !!this.initialKey : !!stored;
  }

  public async search(
    searchTerm: string,
    pageZeroIndexed: number,
    language: string
  ): Promise<ISearchResult> {
    const key = localStorage.getItem("pixabayApiKey");
    if (!key) {
      return {
        images: [],
        // Not translated: not worth it for an error condition we never expect the user to see.
        error: "Could not get a Pixabay API key",
      };
    }

    const perPage = 20;
    // Check if we've already received all available results
    if (this.totalHits > 0 && pageZeroIndexed * perPage >= this.totalHits) {
      return { images: [] };
    }

    const term = encodeURIComponent(searchTerm);
    const imageType = "illustration";
    try {
      const response = await axios.get<PixabayResponse>(
        `https://pixabay.com/api/?` +
          `key=${key}` +
          `&safesearch=true&q=${term}` +
          `&page=${pageZeroIndexed + 1}&per_page=${perPage}`
        //+ `&image_type=${imageType}`
      );

      // Store the total hits for pagination
      this.totalHits = response.data.totalHits;

      return {
        images: response.data.hits.map(
          (hit: PixabayImage) => {
            console.log(`Pixabay hit=${JSON.stringify(hit)}`);
            // Describe the file we will download, not the original, which can be several
            // times bigger (BL-17034). Pixabay doesn't give that file's size in bytes, and
            // its CDN sends no CORS header, so the browser can't ask for it either.
            const downloaded = scaledToFit(
              hit.imageWidth,
              hit.imageHeight,
              kLargeImageMaxDimension
            );
            return {
              thumbnailUrl: hit.previewURL,
              // review: we have at least 3 premade sizes and can get a custom size too
              reasonableSizeUrl: hit.webformatURL, // note: with the hit.webformatURL, we can actually request a smaller image if we knew that HD is overkill
              url: hit.largeImageURL, // 1280px max; used as the download URL when confirmed
              sourceWebPage: hit.pageURL,
              sourceWebPageLabel: "View on Pixabay",
              size: 0,
              sizeUnavailable: true,
              type: "?",
              width: downloaded.width,
              height: downloaded.height,
              license: "Pixabay License",
              licenseUrl: "https://pixabay.com/service/license/",
              creator: hit.user,
              credits: hit.user, // photographer holds the copyright under Pixabay License
              raw: hit,
            } as IImage;
          }
        ),
      };
    } catch (error) {
      console.error("Pixabay search failed:", error);
      return failedSearch("Pixabay", error);
    }
  }

  public aboutComponent(): JSX.Element {
    const l10n = useL10n();
    const [apiKey, setApiKey] = useLocalStorageString("pixabayApiKey");
    const [keyInTextField, setKeyInTextField] = useState(
      localStorage.getItem("pixabayApiKey") || ""
    );

    return (
      <>
        <ProviderSummary title={l10n("ImageLibrary.AboutPixabay", "About Pixabay")}>
          {l10n("ImageLibrary.PixabayDescription", "Pixabay is a large collection of images that may be used for free without attribution.")}
        </ProviderSummary>
        {!apiKey && (
          <Alert severity="info" sx={{ marginBottom: 2 }}>
            {l10n("ImageLibrary.PixabayApiKeyInstructions", "To use Pixabay, you need an API key:")}
            <ol>
              <li>
                {interpolateJsx(
                  l10n("ImageLibrary.PixabayOrIfLoggedIn", "{0} or, if already logged in, {1}"),
                  [
                    <a
                      key="login"
                      href="https://pixabay.com/accounts/login/?next=/api/docs/%2523api_search_images"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {l10n("ImageLibrary.PixabayLogIn", "Log in to Pixabay")}
                    </a>,
                    <a
                      key="api-key"
                      href="https://pixabay.com/api/docs/#api_search_images"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {l10n("ImageLibrary.PixabayGoToApiKeyPage", "go to the API key page")}
                    </a>,
                  ]
                )}
              </li>
              <li>{l10n("ImageLibrary.PixabayFindKey", 'Copy the API key shown on that page, next to "Your API key:"')}</li>
              <li>{l10n("ImageLibrary.PixabayStep4", "Paste it below")}</li>
            </ol>
          </Alert>
        )}
        <TextField
          label={l10n("ImageLibrary.PixabayApiKeyLabel", "Pixabay API Key")}
          value={keyInTextField}
          onChange={(e) => setKeyInTextField(e.target.value)}
          onBlur={() => {
            const trimmedKey = keyInTextField.trim();
            if (trimmedKey) {
              setApiKey(trimmedKey);
            } else {
              setApiKey("");
            }
            setKeyInTextField(trimmedKey);
            this.onKeyChange?.(trimmedKey);
            this.onReadyStateChange?.();
          }}
          fullWidth
          sx={{ marginBottom: 2 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={l10n("ImageLibrary.PasteApiKeyFromClipboard", "Paste API key from clipboard")}
                  title={l10n("EditTab.PasteButton", "Paste")}
                  edge="end"
                  onClick={async () => {
                    const text = (await navigator.clipboard.readText()).trim();
                    setKeyInTextField(text);
                    setApiKey(text);
                    this.onKeyChange?.(text);
                    this.onReadyStateChange?.();
                  }}
                >
                  <ContentPasteIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <StandardDisclaimer />
      </>
    );
  }
}

export interface PixabayImage {
  id: number;
  previewURL: string; // 	Low resolution images with a maximum width or height of 150 px (previewWidth x previewHeight).

  /* Medium sized image with a maximum width or height of 640 px (webformatWidth x webformatHeight). URL valid for 24 hours.
    Replace '_640' in any webformatURL value to access other image sizes:
    Replace with '_180' or '_340' to get a 180 or 340 px tall version of the image, respectively. Replace with '_960' to get the image in a maximum dimension of 960 x 720 px.
  */
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;

  // Dimensions and size of the original full-resolution image.
  imageWidth: number;
  imageHeight: number;
  imageSize: number; // Size of the original image in bytes.

  largeImageURL: string; // Scaled image with a maximum width/height of 1280px.

  pageURL: string; // URL to the page on Pixabay, where the image can be found.

  // only available if your account has been approved for full API access
  // fullHDURL	Full HD scaled image with a maximum width/height of 1920px.
  fullHDURL: string;
  size: number; // Size of the image in bytes.
  user: string; // User name of the contributor.
}

interface PixabayResponse {
  totalHits: number; // how many we can get from this API
  hits: PixabayImage[];
}
