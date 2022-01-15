import { css } from '@emotion/react';
import { Divider } from '@mui/material';
import React from 'react';
import { ImageDetails } from './ImageDetails';
import { ImageSearch } from './ImageSearch';

export const ImageScreen: React.FunctionComponent<{}> = (props) => {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 500px; // enhance
        padding: 20px;
      `}>
      <ImageSearch />
      <Divider orientation="vertical" flexItem />
      <ImageDetails />
    </div>
  );
};
