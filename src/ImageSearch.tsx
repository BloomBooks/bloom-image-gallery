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

import { IImageProvider } from "./ImageProvider";

export const ImageSearch: React.FunctionComponent<{
  provider: IImageProvider;
  lang: string;
  handleSelection: (item: string) => void;
}> = (props) => {
  const [searchTerm, setSearchTerm] = React.useState("tree");
  const [searchLanguage, setSearchLanguage] = React.useState(props.lang);
  const [imagesFound, setImagesFound] = React.useState([] as string[]);
  const [isLoading, setIsLoading] = React.useState(false);

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
    props.provider
      .search(searchTerm, searchLanguage)
      .then((images) => {
        props.handleSelection("");
        if (images) {
          setImagesFound(images);
        } else {
          setImagesFound([]);
        }
        setIsLoading(false);
      })
      .catch((reason) => {
        console.log(`Image search failed: ${reason}`);
        setImagesFound([]);
        setIsLoading(false);
      });
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
    setImagesFound([]);
    // Only clear search if collection or language changes
    if (searchTerm !== "tree") {
      setSearchTerm("");
    }
  }, [props.provider, props.lang]);

  return (
    <div
      css={css`
        flex-grow: 1;
      `}
    >
      <div
        css={css`
          display: flex;
          flex-direction: row;
          align-items: center;
        `}
      >
        <TextField
          id="outlined-basic"
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          sx={{ width: "300px" }}
        ></TextField>
        {/* MUI IconButton by itself can't be contained. So we use a normal
        Button with no text. */}
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
              margin: 0; // center the icon
            }
            margin-left: 5px;
          `}
        ></Button>
        <Select
          value={searchLanguage}
          onChange={handleLanguageChange}
          size="small"
          sx={{ marginLeft: 1 }}
        >
          {["en", "es"].map((value, index) => {
            return (
              <MenuItem key={value} value={value}>
                {getLanguageNameFromTag(value)}
              </MenuItem>
            );
          })}
        </Select>{" "}
      </div>
      <SearchResults
        images={imagesFound}
        handleSelection={props.handleSelection}
        isLoading={isLoading}
      />
    </div>
  );
};
