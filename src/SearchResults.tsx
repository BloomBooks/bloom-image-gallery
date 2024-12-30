import { css } from "@emotion/react";
import {
  ImageList,
  ImageListItem,
  CircularProgress,
  Skeleton,
  Alert,
} from "@mui/material";
import React, { useState } from "react";
import { IImage } from "./providers/imageProvider";
import { useIntersectionObserver } from "./hooks/useIntersectionObserver";
import { ErrorBoundary } from "./components/ErrorBoundary";

const formatImageTitle = (image: IImage): string => {
  const parts: string[] = [];
  //if (image.license) parts.push(`License: ${image.license}`);
  if (image.width && image.height) parts.push(`${image.width}×${image.height}`);
  //if (image.type) parts.push(`Type: ${image.type}`);
  return parts.length > 0 ? parts.join(" | ") : "No metadata available";
};

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
          title={formatImageTitle(image)}
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
  error?: string;
  onBottomReached?: () => void;
}> = (props) => {
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (
      scrollHeight - scrollTop <= clientHeight * 1.5 &&
      !props.isLoading &&
      props.onBottomReached
    ) {
      props.onBottomReached();
    }
  };

  return (
    <ErrorBoundary>
      <div
        css={css`
          flex-grow: 0;
          position: relative;
          height: 550px;
          width: 550px;
          overflow-y: scroll;
        `}
        onScroll={handleScroll}
      >
        <ImageList cols={3} rowHeight={164}>
          {props.images.map((image) => (
            <ImageListItemWithLazyLoad
              key={image.thumbnailUrl}
              image={image}
              onSelect={props.handleSelection}
            />
          ))}
        </ImageList>
        {props.isLoading && (
          <div
            css={css`
              display: flex;
              justify-content: center;
              padding: 20px;
            `}
          >
            <CircularProgress />
          </div>
        )}
        {props.error && (
          <Alert
            severity="error"
            sx={{
              margin: "10px",
              position: "sticky",
              bottom: 0,
            }}
          >
            {props.error}
          </Alert>
        )}
      </div>
    </ErrorBoundary>
  );
};
