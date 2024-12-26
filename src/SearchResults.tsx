import { css } from "@emotion/react";
import {
  ImageList,
  ImageListItem,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import React, { useState } from "react";
import { IImage } from "./providers/imageProvider";
import { useIntersectionObserver } from "./hooks/useIntersectionObserver";
import { ErrorBoundary } from "./components/ErrorBoundary";

const ImageListItemWithLazyLoad: React.FC<{
  image: IImage;
  onSelect: (image: IImage) => void;
}> = ({ image, onSelect }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { elementRef, isVisible } = useIntersectionObserver<HTMLLIElement>({
    threshold: 0.1,
    rootMargin: "50px",
  });

  return (
    <ImageListItem
      ref={elementRef}
      onClick={() => onSelect(image)}
      sx={{ position: "relative" }}
      component="li"
    >
      {(!isLoaded || !isVisible) && (
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
      {isVisible && (
        <img
          src={image.thumbnailUrl}
          width={164}
          height={164}
          onLoad={() => setIsLoaded(true)}
          css={css`
            object-fit: scale-down;
            position: relative;
            z-index: ${isLoaded ? 2 : 0};
          `}
        />
      )}
    </ImageListItem>
  );
};

export const SearchResults: React.FunctionComponent<{
  images: IImage[];
  handleSelection: (item: IImage | undefined) => void;
  isLoading: boolean;
}> = (props) => {
  return (
    <ErrorBoundary>
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
            {props.images.map((image) => (
              <ImageListItemWithLazyLoad
                key={image.thumbnailUrl}
                image={image}
                onSelect={props.handleSelection}
              />
            ))}
          </ImageList>
        )}
      </div>
    </ErrorBoundary>
  );
};
