import { css } from "@emotion/react";
import {
  ImageList,
  ImageListItem,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import React, { useState } from "react";

export const SearchResults: React.FunctionComponent<{
  images: string[];
  handleSelection: (item: string) => void;
  isLoading: boolean;
}> = (props) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (item: string) => {
    setLoadedImages((prev) => new Set([...prev, item]));
  };

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
              sx={{ position: "relative" }}
            >
              {!loadedImages.has(item) && (
                <Skeleton
                  variant="rectangular"
                  width={164}
                  height={164}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 1,
                  }}
                />
              )}
              <img
                src={`http://localhost:5000/image-toolbox/collection-image-file/${item}`}
                width={164}
                height={164}
                alt={item.substring(item.lastIndexOf("%2f") + 3)}
                loading="lazy"
                onLoad={() => handleImageLoad(item)}
                css={css`
                  object-fit: scale-down;
                  position: relative;
                  z-index: ${loadedImages.has(item) ? 2 : 0};
                `}
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </div>
  );
};
