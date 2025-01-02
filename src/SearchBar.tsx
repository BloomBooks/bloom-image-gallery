import { css } from "@emotion/react";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import React from "react";
import SearchIcon from "@mui/icons-material/Search";
import {
  IImageCollectionProvider,
  ISearchResult,
} from "./providers/imageProvider";

export const SearchBar: React.FunctionComponent<{
  provider: IImageCollectionProvider;
  initialLanguage: string;
  onSearch: (searchTerm: string, language: string) => void;
}> = (props) => {
  const [searchLanguage, setSearchLanguage] = React.useState(
    props.initialLanguage
  );

  const [searchTerm, setSearchTerm] = React.useState("bubbles");

  const handleLanguageChange = (
    event: SelectChangeEvent<string>,
    child: React.ReactNode
  ) => {
    const newLang = event.target.value;
    setSearchLanguage(newLang);
    props.onSearch(searchTerm, newLang);
  };

  const getLanguageNameFromTag = (tag: string): string => {
    switch (tag) {
      case "en":
        return "English";
      case "es":
        return "Spanish";
      default:
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
      {props.provider.logo && (
        <div
          css={css`
            display: flex;
            align-items: center;
          `}
        >
          <img
            src={props.provider.logo}
            alt={props.provider.label}
            css={css`
              height: 30px;
              margin-right: 10px;
            `}
          />
          {!props.provider.isReady && (
            <span
              css={css`
                color: #666;
                font-style: italic;
              `}
            >
              Not Ready
            </span>
          )}
        </div>
      )}
      {props.provider.isReady && (
        <>
          {props.provider.justAListNoQuery ? (
            <Button
              variant="contained"
              size="small"
              onClick={() => props.onSearch(searchTerm, searchLanguage)}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    props.onSearch(searchTerm, searchLanguage);
                  }
                }}
                onChange={(e) => setSearchTerm(e.target.value)}
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
