import { css } from "@emotion/react";
import { useTheme } from "@mui/material/styles";
import React, { useEffect } from "react";
import { useL10n } from "./localization";
import { SearchResults } from "./SearchResults";
import {
  ISearchProvider,
  IImage,
  ISearchResult,
} from "./search-providers/imageProvider";
import { SearchBar } from "./SearchBar";

export const ImageSearch: React.FunctionComponent<{
  provider: ISearchProvider;
  lang: string;
  handleSelection: (item: IImage | undefined) => void;
  // thumbnailUrl of the currently selected image, so its tile can show the ring/badge
  selectedImageKey?: string;
  initialSearchTerm?: string;
  onSearchTermChange?: (term: string) => void;
  onLanguageChange?: (lang: string) => void;
}> = (props) => {
  const l10n = useL10n();
  const theme = useTheme();
  const [searchResult, setSearchResult] = React.useState<ISearchResult>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastRetrievedPageZeroIndexed, setLastRetrievedPageZeroIndexed] =
    React.useState(0);

  // used for paging
  const [previousSearchTerm, setPreviousSearchTerm] = React.useState("");
  const [previousLanguage, setPreviousLanguage] = React.useState(props.lang);

  function searchForImages(term: string, language: string): void {
    setIsLoading(true);
    setLastRetrievedPageZeroIndexed(0);
    // Clear existing results immediately for new searches
    setSearchResult(undefined);
    props.provider
      .search(term, 0, language)
      .then((result: ISearchResult) => {
        props.handleSelection(undefined);
        setSearchResult(result);
        setIsLoading(false);
      })
      .catch((reason) => {
        console.log(`Image search failed: ${reason}`);
        setSearchResult(undefined);
        setIsLoading(false);
      });
  }

  function loadNextPage(): void {
    if (searchResult && !isLoading) {
      const nextPage = lastRetrievedPageZeroIndexed + 1;
      setIsLoading(true);
      // Don't clear existing results while loading more
      props.provider
        .search(previousSearchTerm, nextPage, previousLanguage)
        .then((result: ISearchResult) => {
          setSearchResult({
            images: [...searchResult.images, ...result.images],
            error: result.error,
          });
          setLastRetrievedPageZeroIndexed(nextPage);
          setIsLoading(false);
        })
        .catch((reason) => {
          console.log(`Image search failed: ${reason}`);
          setSearchResult({
            ...searchResult,
            error: `Failed to get more images: ${reason}`,
          });
          //setSearchResult(undefined);
          setIsLoading(false);
        });
    }
  }

  useEffect(() => {
    setSearchResult(undefined);
    // Changing the source invalidates the current selection.
    props.handleSelection(undefined);
    // If this is just a list with no query capability, load it immediately
    if (props.provider.justAListNoQuery) {
      searchForImages("unused", props.lang);
    }
  }, [props.provider, props.lang]);

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        min-width: 0;
      `}
    >
      <div
        css={css`
          display: flex;
          flex-direction: row;
          align-items: center;
          flex: none;
          margin-bottom: 24px;
        `}
      >
        {props.provider.logo && (
          <img
            src={props.provider.logo}
            alt={props.provider.label}
            css={css`
              height: 30px;
              margin-right: 10px;
            `}
          />
        )}
        <h2
          css={css`
            margin: 0;
            font-size: 1.3em;
          `}
        >
          {props.provider.label}
        </h2>
      </div>
      <div
        css={css`
          flex: none;
        `}
      >
        <SearchBar
          provider={props.provider}
          initialLanguage={props.lang}
          initialSearchTerm={props.initialSearchTerm}
          onSearchTermChange={props.onSearchTermChange}
          onSearch={(term, lang) => {
            searchForImages(term, lang);
            // store the term and language for paging
            setPreviousSearchTerm(term);
            if (lang !== previousLanguage) {
              props.onLanguageChange?.(lang);
            }
            setPreviousLanguage(lang);
          }}
        />
        {searchResult?.totalImages !== undefined && (
          <div
            css={css`
              color: ${theme.palette.text.secondary};
              font-size: 14px;
              margin: 14px 2px 16px;
            `}
          >
            {l10n("ImageLibrary.ImageCount", "{0} images", searchResult.totalImages.toLocaleString())}
          </div>
        )}
      </div>
      {(isLoading || (searchResult && searchResult.images.length > 0)) && (
        <SearchResults
          images={searchResult?.images || []}
          handleSelection={props.handleSelection}
          isLoading={isLoading}
          error={searchResult?.error}
          onBottomReached={() => loadNextPage()}
          selectedImageKey={props.selectedImageKey}
        />
      )}
      {searchResult &&
        searchResult.images.length === 0 &&
        !isLoading &&
        !searchResult.error && (
          <div
            css={css`
              flex: none;
              margin-top: 20px;
              color: ${theme.palette.text.secondary};
            `}
          >
            {l10n("ImageLibrary.NoMatchesFound", "No matches found")}
          </div>
        )}
    </div>
  );
};

export const About: React.FunctionComponent<{ provider: ISearchProvider }> = (
  props
) => {
  return (
    <div
      css={css`
        flex: none;
      `}
    >
      {props.provider.aboutComponent && props.provider.aboutComponent()}
    </div>
  );
};
