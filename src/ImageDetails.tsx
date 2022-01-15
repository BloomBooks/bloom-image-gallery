import { css } from '@emotion/react';
import { Divider } from '@mui/material';
import React from 'react';

export const ImageDetails: React.FunctionComponent<{}> = (props) => {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        width: 300px;
        margin-left: 10px;
      `}>
      <img
        about="s"
        src={`https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=164&h=164&fit=crop&auto=format?w=164&h=164&fit=crop&auto=format`}
        alt={'foo'}
        loading="lazy"
        css={css`
          margin-bottom: 15px;
        `}
      />
      <div
        css={css`
          text-align: center;
        `}>
        1000 x 100 pixels<br></br>
        1.2 Megabytes<br></br>JPEG
      </div>
    </div>
  );
};
