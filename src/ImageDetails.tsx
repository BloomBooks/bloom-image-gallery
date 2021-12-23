import { css } from '@emotion/react';
import { Divider } from '@mui/material';
import React from 'react';

export const ImageDetails: React.FunctionComponent<{}> = (props) => {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        background-color: lightgray;
        width: 300px;
        margin-left: 10px;
      `}>
      <div>current image</div>
    </div>
  );
};
