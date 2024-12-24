import { css } from '@emotion/react';
import { Button, TextField, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import React, { useEffect } from 'react';
import { SearchResults } from './SearchResults';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
export const ImageSearch: React.FunctionComponent<{
  collection: string;
  lang: string;
  handleSelection: (item: string) => void;
}> = (props) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchLanguage, setSearchLanguage] = React.useState(props.lang);
  const [imagesFound, setImagesFound] = React.useState([] as string[]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter') {
      searchForImages();
    }
  };
  const handleLanguageChange = (
    event: SelectChangeEvent<string>,
    child: React.ReactNode,
  ) => {
    console.log(
      `DEBUG handleLanguageChange(): value=${event.target.value} name=${event.target.name}`,
    );
    setSearchLanguage(event.target.value);
  };

  function searchForImages(): void {
    const uriSearch = `http://localhost:5000/image-toolbox/search/${props.collection.replaceAll(
      ' ',
      '%20',
    )}/${searchLanguage}/${searchTerm.replaceAll(' ', '%20')}`;
    axios
      .get(uriSearch)
      .then((response) => {
        props.handleSelection('');
        const images = response.data as string[];
        if (images) {
          setImagesFound(images);
        } else {
          setImagesFound([]);
        }
      })
      .catch((reason) => {
        console.log(`axios call image-toolbox/collections failed: ${reason}`);
        setImagesFound([]);
      });
  }

  function getLanguageNameFromTag(tag: string): string {
    switch (tag) {
      case 'en':
        return 'English';
      case 'es':
        return 'Spanish';
      default:
        return tag;
    }
  }

  useEffect(() => {
    setImagesFound([]);
    const input = document.getElementById('outlined-basic') as HTMLInputElement;
    if (input) input.value = '';
    setSearchTerm('');
  }, [props.collection, props.lang]);

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
        `}
      >
        <TextField
          id="outlined-basic"
          label="Search"
          variant="outlined"
          size="small"
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          sx={{ width: '300px' }}
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
        <Select value={searchLanguage} onChange={handleLanguageChange}>
          {['en', 'es'].map((value, index) => {
            return (
              <MenuItem key={value} value={value}>
                {getLanguageNameFromTag(value)}
              </MenuItem>
            );
          })}
        </Select>{' '}
      </div>
      <SearchResults
        collection={props.collection}
        images={imagesFound}
        handleSelection={props.handleSelection}
      />
    </div>
  );
};
