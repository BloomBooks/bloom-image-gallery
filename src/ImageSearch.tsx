import { css } from "@emotion/react";
import React, { useEffect } from "react";
import { SearchResults } from "./SearchResults";
import {
  IImageCollectionProvider,
  IImage,
  ISearchResult,
} from "./providers/imageProvider";
import { SearchBar } from "./SearchBar";

export const ImageSearch: React.FunctionComponent<{
  provider: IImageCollectionProvider;
  lang: string;
  handleSelection: (item: IImage | undefined) => void;
}> = (props) => {
  const [searchResult, setSearchResult] = React.useState<ISearchResult>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastRetrievedPageZeroIndexed, setLastRetrievedPageZeroIndexed] =
    React.useState(0);

  // used for paging
  const [previousSearchTerm, setPreviousSearchTerm] = React.useState("");

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

  function loadNextPage(language: string): void {
    if (searchResult && !isLoading) {
      const nextPage = lastRetrievedPageZeroIndexed + 1;
      setIsLoading(true);
      // Don't clear existing results while loading more
      props.provider
        .search(previousSearchTerm, nextPage, language)
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
    // If this is just a list with no query capability, load it immediately
    if (props.provider.justAListNoQuery) {
      searchForImages("unused", props.lang);
    }
  }, [props.provider, props.lang]);

  return (
    <div
      css={css`
        flex-grow: 0;
        min-width: 600px;
      `}
    >
      <div>
        <SearchBar
          provider={props.provider}
          initialLanguage={props.lang}
          onSearch={(term, lang) => {
            searchForImages(term, lang);
            setPreviousSearchTerm(term); // store the term for paging
          }}
        />
        {searchResult?.totalImages !== undefined && (
          <span
            css={css`
              margin-left: 10px;
              color: #666;
              font-size: 0.9em;
            `}
          >
            {searchResult.totalImages.toLocaleString()} images
          </span>
        )}
      </div>
      {(!searchResult || searchResult.images.length === 0) && (
        <About provider={props.provider} />
      )}
      {searchResult?.images && searchResult.images.length > 0 && (
        <SearchResults
          images={searchResult?.images || []}
          handleSelection={props.handleSelection}
          isLoading={isLoading}
          error={searchResult?.error}
          onBottomReached={() => loadNextPage(props.lang)}
        />
      )}
    </div>
  );
};

const About: React.FunctionComponent<{ provider: IImageCollectionProvider }> = (
  props
) => {
  return (
    <div
      css={css`
        margin: 100px 0 20px 0;
        max-width: 500px;
      `}
    >
      {props.provider.aboutComponent && props.provider.aboutComponent()}
    </div>
  );
};
