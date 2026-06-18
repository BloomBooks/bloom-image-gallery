import { css } from "@emotion/react";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import React from "react";
import { Search as SearchIcon } from "@mui/icons-material";
import {
  ISearchProvider,
  ISearchResult,
} from "./search-providers/imageProvider";
import { useL10n } from "./localization";

// Used to turn language tags into human-readable names. Created once; guarded
// because Intl.DisplayNames may be unavailable in some environments.
const languageDisplayNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(
        [typeof navigator !== "undefined" ? navigator.language : "en"],
        { type: "language" }
      )
    : undefined;

export const SearchBar: React.FunctionComponent<{
  provider: ISearchProvider;
  initialLanguage: string;
  initialSearchTerm?: string;
  onSearchTermChange?: (term: string) => void;
  onSearch: (searchTerm: string, language: string) => void;
}> = (props) => {
  const l10n = useL10n();
  const [searchLanguage, setSearchLanguage] = React.useState(
    props.initialLanguage
  );

  const [searchTerm, setSearchTerm] = React.useState(props.initialSearchTerm ?? "bubbles");

  const handleLanguageChange = (
    event: SelectChangeEvent<string>,
    child: React.ReactNode
  ) => {
    const newLang = event.target.value;
    setSearchLanguage(newLang);
    props.onSearch(searchTerm, newLang);
  };

  // Map a language tag (e.g. "en", "fr") to a display name, the way Bloom shows
  // real language names in the Art of Reading search-language menu. Uses the
  // platform's Intl.DisplayNames and falls back to the raw tag if it can't.
  const getLanguageNameFromTag = (tag: string): string => {
    try {
      return languageDisplayNames?.of(tag) ?? tag;
    } catch {
      return tag;
    }
  };

  return (
    <div
      css={css`
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 10px;
      `}
    >
      {props.provider.isReady && (
        <>
          {props.provider.justAListNoQuery ? (
            <Button
              variant="contained"
              size="small"
              onClick={() => props.onSearch(searchTerm, searchLanguage)}
              startIcon={<SearchIcon />}
            >
              {l10n("ImageLibrary.Refresh", "Refresh")}
            </Button>
          ) : (
            <>
              <TextField
                id="outlined-basic"
                label={l10n("ImageLibrary.Search", "Search")}
                variant="outlined"
                size="small"
                value={searchTerm}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    props.onSearch(searchTerm, searchLanguage);
                  }
                }}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  props.onSearchTermChange?.(e.target.value);
                }}
                sx={{ width: "150px" }}
              ></TextField>
              <Button
                variant="contained"
                size="small"
                onClick={() => props.onSearch(searchTerm, searchLanguage)}
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
            </>
          )}
        </>
      )}
      {props.provider.isReady && props.provider.languages && (
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
  );
};
