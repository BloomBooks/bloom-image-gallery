import { css } from "@emotion/react";
import { Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React, { useEffect } from "react";
import { useL10n } from "./localization";
import { SearchResults } from "./SearchResults";
import {
  failedSearch,
  ISearchProvider,
  IImage,
  ISearchReport,
  ISearchResult,
} from "./search-providers/imageProvider";
import { SearchBar } from "./SearchBar";
import { useOnlineStatus } from "./hooks/useOnlineStatus";

// Providers that catch their own failures (see failedSearch) resolve with an error and no
// images, rather than rejecting.
const failedOutright = (result: ISearchResult): boolean =>
  !!result.error && result.images.length === 0;

export const ImageSearch: React.FunctionComponent<{
  provider: ISearchProvider;
  lang: string;
  handleSelection: (item: IImage | undefined) => void;
  // thumbnailUrl of the currently selected image, so its tile can show the ring/badge
  selectedImageKey?: string;
  initialSearchTerm?: string;
  onSearchTermChange?: (term: string) => void;
  onLanguageChange?: (lang: string) => void;
  // Called once per search (not per page) with what was searched for and what came back.
  onSearch?: (report: ISearchReport) => void;
}> = (props) => {
  const l10n = useL10n();
  const theme = useTheme();
  const [searchResult, setSearchResult] = React.useState<ISearchResult>();
  const [isLoading, setIsLoading] = React.useState(false);
  // Counts searches, so the results grid can tell a new search from more pages of the last one.
  const [searchCount, setSearchCount] = React.useState(0);
  const [lastRetrievedPageZeroIndexed, setLastRetrievedPageZeroIndexed] =
    React.useState(0);

  // used for paging
  const [previousSearchTerm, setPreviousSearchTerm] = React.useState("");
  const [previousLanguage, setPreviousLanguage] = React.useState(props.lang);

  const isOnline = useOnlineStatus();
  // A local collection can fail to answer too, but that is not about the internet.
  const isOfflineFailure = !!searchResult?.offline && !props.provider.local;
  const errorMessage = isOfflineFailure
    ? l10n("ImageLibrary.CannotReachSource", "Could not reach {0}. Check that this computer is connected to the internet.", props.provider.label)
    : searchResult?.error;

  // Stamp each image with the provider it came from, so that the host can report where a chosen
  // image was found instead of having to guess from its URL.
  function withProviderId(images: IImage[]): IImage[] {
    return images.map((image) => ({ ...image, providerId: props.provider.id }));
  }

  // Tell the host what a search did, unless this "search" was really just loading a provider
  // that has no query (the browser-extension queue), where there is no term worth reporting.
  //
  // The host callback is isolated on purpose. It is called from inside the search promise
  // chain, so without this a host whose analytics code threw would land in the chain's catch
  // below -- wiping perfectly good results off the screen and then reporting a second, bogus
  // "the search failed". Telling the host about a search must not be able to change what the
  // user sees.
  function reportSearch(report: ISearchReport): void {
    if (props.provider.justAListNoQuery) return;
    const complain = (error: unknown) =>
      console.log(`onSearch host callback failed: ${error}`);
    try {
      // Promise.resolve covers a host that made onSearch async: the type says it returns void,
      // but nothing stops it, and a rejected promise we did not catch would surface as an
      // unhandled rejection in the host runtime -- which in Bloom means a problem report shown
      // to the user, over analytics. Between the two, every way this can fail is contained.
      void Promise.resolve(props.onSearch?.(report)).catch(complain);
    } catch (error) {
      complain(error);
    }
  }

  function searchForImages(term: string, language: string): void {
    setIsLoading(true);
    setSearchCount((count) => count + 1);
    setLastRetrievedPageZeroIndexed(0);
    // Clear existing results immediately for new searches
    setSearchResult(undefined);
    props.provider
      .search(term, 0, language)
      .then((result: ISearchResult) => {
        props.handleSelection(undefined);
        setSearchResult({ ...result, images: withProviderId(result.images) });
        setIsLoading(false);
        reportSearch({
          term,
          providerId: props.provider.id,
          language,
          // Report a failure as the failed search it is, not as a search that found nothing.
          resultCount: failedOutright(result)
            ? undefined
            : (result.totalImages ?? result.images.length),
          error: result.error,
        });
      })
      .catch((reason) => {
        console.log(`Image search failed: ${reason}`);
        // Show the failure, rather than an empty pane that looks like nothing happened.
        setSearchResult(failedSearch(props.provider.label, reason));
        setIsLoading(false);
        reportSearch({
          term,
          providerId: props.provider.id,
          language,
          error: `${reason}`,
        });
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
            images: [...searchResult.images, ...withProviderId(result.images)],
            // Keep the count. Leaving it out here is what used to make the "N images" label
            // vanish the moment the user scrolled far enough to load a second page: this
            // replaces the whole result object, so an absent totalImages reads as "this
            // provider does not report a total". Providers that do report one send it with
            // every page; falling back to the total we already had covers any that do not.
            totalImages: result.totalImages ?? searchResult.totalImages,
            error: result.error,
            offline: result.offline,
          });
          // A provider that caught its own failure resolves rather than rejecting. Stay on the
          // page before it, so that scrolling again (say, once back online) retries the page
          // that failed instead of skipping over its images.
          if (!failedOutright(result)) setLastRetrievedPageZeroIndexed(nextPage);
          setIsLoading(false);
        })
        .catch((reason) => {
          console.log(`Image search failed: ${reason}`);
          const failure = failedSearch(props.provider.label, reason);
          // Keep the images we already have; just say why there are no more.
          setSearchResult({
            ...searchResult,
            error: failure.error,
            offline: failure.offline,
          });
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
        {/* Only a hint (see useOnlineStatus); a failed search is the real check. Once one has
            failed for being offline, its message says the same thing, so this one steps aside. */}
        {!props.provider.local && !isOnline && !isOfflineFailure && (
          <Alert severity="warning" sx={{ marginTop: 2 }}>
            {l10n("ImageLibrary.ComputerSeemsOffline", "This computer seems to be offline. Searching {0} needs an internet connection.", props.provider.label)}
          </Alert>
        )}
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
      {/* SearchResults is where errors are shown, so it is needed for a failed search too,
          even one that brought back no images at all. */}
      {(isLoading ||
        (searchResult &&
          (searchResult.images.length > 0 || searchResult.error))) && (
        <SearchResults
          images={searchResult?.images || []}
          handleSelection={props.handleSelection}
          isLoading={isLoading}
          error={errorMessage}
          onBottomReached={() => loadNextPage()}
          selectedImageKey={props.selectedImageKey}
          searchId={searchCount}
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
