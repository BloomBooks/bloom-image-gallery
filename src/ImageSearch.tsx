import { css } from "@emotion/react";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import React, { useEffect } from "react";
import { SearchResults } from "./SearchResults";
import SearchIcon from "@mui/icons-material/Search";
import {
  IImageCollectionProvider,
  IImage,
  ISearchResult,
} from "./providers/imageProvider";

export const ImageSearch: React.FunctionComponent<{
  provider: IImageCollectionProvider;
  lang: string;
  handleSelection: (item: IImage | undefined) => void;
}> = (props) => {
  const [searchTerm, setSearchTerm] = React.useState("sun");
  const [searchLanguage, setSearchLanguage] = React.useState(props.lang);
  const [searchResult, setSearchResult] = React.useState<ISearchResult>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastRetrievedPageZeroIndexed, setLastRetrievedPageZeroIndexed] =
    React.useState(0);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter") {
      searchForImages();
    }
  };
  const handleLanguageChange = (
    event: SelectChangeEvent<string>,
    child: React.ReactNode
  ) => {
    console.log(
      `DEBUG handleLanguageChange(): value=${event.target.value} name=${event.target.name}`
    );
    setSearchLanguage(event.target.value);
  };

  function searchForImages(): void {
    setIsLoading(true);
    setLastRetrievedPageZeroIndexed(0);
    // Clear existing results immediately for new searches
    setSearchResult(undefined);
    props.provider
      .search(searchTerm, 0, searchLanguage)
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
        .search(searchTerm, nextPage, searchLanguage)
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

  function getLanguageNameFromTag(tag: string): string {
    switch (tag) {
      case "en":
        return "English";
      case "es":
        return "Spanish";
      default:
        return tag;
    }
  }

  useEffect(() => {
    setSearchResult(undefined);
    // If this is just a list with no query capability, load it immediately
    if (props.provider.justAListNoQuery) {
      searchForImages();
    }
  }, [props.provider, props.lang]); // moved searchForImages out of deps to avoid infinite loop

  return (
    <div
      css={css`
        flex-grow: 0;
      `}
    >
      <div
        css={css`
          display: flex;
          flex-direction: row;
          align-items: center;
          margin-bottom: 10px;
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
        {props.provider.justAListNoQuery ? (
          <Button
            variant="contained"
            size="small"
            onClick={() => searchForImages()}
            startIcon={<SearchIcon />}
          >
            Refresh
          </Button>
        ) : (
          <>
            <TextField
              id="outlined-basic"
              label="Search"
              variant="outlined"
              size="small"
              value={searchTerm}
              onKeyDown={handleKeyDown}
              onChange={handleChange}
              sx={{ width: "150px" }}
            ></TextField>
            <Button
              variant="contained"
              size="small"
              onClick={() => searchForImages()}
              startIcon={
                <SearchIcon
                  css={css`
                    width: 30px;
                    height: 30px;
                  `}
                />
              }
              css={css`
                span {
                  margin: 0;
                }
                margin-left: 5px;
              `}
            ></Button>
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
          </>
        )}
        {props.provider.languages && (
          <Select
            value={searchLanguage}
            onChange={handleLanguageChange}
            size="small"
            sx={{ marginLeft: 1 }}
          >
            {props.provider.languages.map((value, index) => {
              return (
                <MenuItem key={value} value={value}>
                  {getLanguageNameFromTag(value)}
                </MenuItem>
              );
            })}
          </Select>
        )}
      </div>
      <SearchResults
        images={searchResult?.images || []}
        handleSelection={props.handleSelection}
        isLoading={isLoading}
        error={searchResult?.error}
        onBottomReached={loadNextPage}
      />
    </div>
  );
};
