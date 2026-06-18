import { css } from "@emotion/react";
import {
  ImageList,
  ImageListItem,
  CircularProgress,
  Skeleton,
  Alert,
} from "@mui/material";
import React, { useState } from "react";
import { IImage } from "./search-providers/imageProvider";
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
          width={140}
          height={140}
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
          width={140}
          height={140}
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
  cols?: number;
}> = (props) => {
  const colCount = props.cols ?? 3;
  const colWidth = 140;
  const gapWidth = 8;
  const scrollbarWidth = 17;
  const gridWidth = colCount * colWidth + Math.max(0, colCount - 1) * gapWidth + scrollbarWidth;

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
          height: 560px;
          width: ${gridWidth}px;
          overflow-y: scroll;
        `}
        onScroll={handleScroll}
      >
        <ImageList cols={colCount} rowHeight={140} sx={{ rowGap: "8px" }}>
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
