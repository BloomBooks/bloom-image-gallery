import { css } from "@emotion/react";
import { ImageList, ImageListItem, CircularProgress } from "@mui/material";
import React from "react";

export const SearchResults: React.FunctionComponent<{
  images: string[];
  handleSelection: (item: string) => void;
  isLoading: boolean;
}> = (props) => {
  return (
    <div
      css={css`
        flex-grow: 1;
        position: relative;
        height: 550px;
        width: 550px;
      `}
    >
      {props.isLoading ? (
        <div
          css={css`
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          `}
        >
          <CircularProgress />
        </div>
      ) : (
        <ImageList sx={{ height: 550 }} cols={3} rowHeight={164}>
          {props.images.map((item) => (
            <ImageListItem
              key={item}
              onClick={() => props.handleSelection(item)}
            >
              <img
                src={`http://localhost:5000/image-toolbox/collection-image-file/${item}`}
                width={164}
                height={164}
                alt={item.substring(item.lastIndexOf("%2f") + 3)}
                loading="lazy"
                css={css`
                  object-fit: scale-down;
                `}
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </div>
  );
};
