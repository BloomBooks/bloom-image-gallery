import { css } from "@emotion/react";
import { ImageList, ImageListItem } from "@mui/material";
import React from "react";

export const SearchResults: React.FunctionComponent<{
  collection: string;
  images: string[];
  handleSelection: (item: string) => void;
}> = (props) => {
  return (
    <div
      css={css`
        flex-grow: 1;
      `}
    >
      <ImageList sx={{ width: 550, height: 550 }} cols={3} rowHeight={164}>
        {props.images.map((item) => (
          <ImageListItem key={item} onClick={() => props.handleSelection(item)}>
            <img
              src={`http://localhost:5000/image-toolbox/collection-image-file/${props.collection}/${item}`}
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
    </div>
  );
};
