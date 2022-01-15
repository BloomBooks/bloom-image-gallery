import { css } from '@emotion/react';
import {
  Button,
  Divider,
  IconButton,
  ImageList,
  ImageListItem,
  TextField,
} from '@mui/material';
import React from 'react';
import { SearchResults } from './SearchResults';
import SearchIcon from '@mui/icons-material/Search';
export const ImageSearch: React.FunctionComponent<{}> = (props) => {
  return (
    <div
      css={css`
        flex-grow: 1;
      `}>
      <div
        css={css`
          display: flex;
          flex-direction: row;
        `}>
        <TextField
          id="outlined-basic"
          label="Search"
          variant="outlined"
          size="small"
          sx={{ width: '300px' }}></TextField>
        {/* MUI IconButton by itself can't be contained. So we use a normal
        Button with no text. */}
        <Button
          variant="contained"
          size="small"
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
          `}></Button>
      </div>
      <SearchResults />
    </div>
  );
};
