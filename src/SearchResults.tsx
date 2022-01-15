import { css } from '@emotion/react';
import { Divider, ImageList, ImageListItem } from '@mui/material';
import React from 'react';

export const SearchResults: React.FunctionComponent<{}> = (props) => {
  return (
    <div
      css={css`
        flex-grow: 1;
      `}>
      <ImageList sx={{ width: 500, height: 450 }} cols={3} rowHeight={164}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <ImageListItem key={item}>
            <img
              src={`https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=164&h=164&fit=crop&auto=format?w=164&h=164&fit=crop&auto=format`}
              alt={item.toString()}
              loading="lazy"
            />
          </ImageListItem>
        ))}
      </ImageList>
    </div>
  );
};
