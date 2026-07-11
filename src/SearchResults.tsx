import { css } from "@emotion/react";
import { CircularProgress, Skeleton, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Check as CheckIcon } from "@mui/icons-material";
import React, { useLayoutEffect, useRef, useState } from "react";
import { IImage } from "./search-providers/imageProvider";
import { useIntersectionObserver } from "./hooks/useIntersectionObserver";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Justified-rows gallery tuning. Rows are laid out to a common target height and
// then scaled so each row fills the full container width at the images' true
// aspect ratios (Flickr/Unsplash style).
const kTargetRowHeight = 150;
const kRowGap = 10;
// Aspect ratio (width/height) assumed for images whose provider didn't report
// dimensions, so they still get a sensible slot instead of collapsing.
const kFallbackAspectRatio = 1;

const formatImageTitle = (image: IImage): string => {
  const parts: string[] = [];
  if (image.width && image.height) parts.push(`${image.width}×${image.height}`);
  return parts.length > 0 ? parts.join(" | ") : "No metadata available";
};

interface IJustifiedTile {
  image: IImage;
  width: number;
  height: number;
}

const aspectRatioOf = (image: IImage): number =>
  image.width && image.height ? image.width / image.height : kFallbackAspectRatio;

// Greedily pack images into rows and scale each row to fill containerWidth.
// Because every tile's box matches its image's real aspect ratio, the thumbnails
// fill their slots edge-to-edge with no cropping and no ragged right edge.
function computeJustifiedRows(
  images: IImage[],
  containerWidth: number
): IJustifiedTile[][] {
  if (containerWidth <= 0 || images.length === 0) return [];
  const rows: IJustifiedTile[][] = [];
  let current: IImage[] = [];
  let aspectSum = 0;

  const commitRow = (isLastRow: boolean) => {
    if (current.length === 0) return;
    const totalGap = (current.length - 1) * kRowGap;
    const available = containerWidth - totalGap;
    let rowHeight = available / aspectSum;
    // The trailing partial row would otherwise blow up a lone wide image to fill
    // the whole width; cap it near the target height and let it be left-aligned.
    if (isLastRow) rowHeight = Math.min(rowHeight, kTargetRowHeight * 1.4);
    rows.push(
      current.map((image) => ({
        image,
        width: rowHeight * aspectRatioOf(image),
        height: rowHeight,
      }))
    );
    current = [];
    aspectSum = 0;
  };

  for (const image of images) {
    current.push(image);
    aspectSum += aspectRatioOf(image);
    // Once the row's natural width at target height reaches the container, it's
    // full: scaling it down to fit yields a height at or below the target.
    const naturalWidth =
      aspectSum * kTargetRowHeight + (current.length - 1) * kRowGap;
    if (naturalWidth >= containerWidth) commitRow(false);
  }
  commitRow(true);
  return rows;
}

const JustifiedTile: React.FC<{
  tile: IJustifiedTile;
  selected: boolean;
  onSelect: (image: IImage) => void;
}> = ({ tile, selected, onSelect }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const [isLoaded, setIsLoaded] = useState(false);
  const { elementRef, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: "100px",
  });

  return (
    <div
      ref={elementRef}
      onClick={() => onSelect(tile.image)}
      title={formatImageTitle(tile.image)}
      css={css`
        position: relative;
        flex: 0 0 ${tile.width}px;
        width: ${tile.width}px;
        height: ${tile.height}px;
        border-radius: 4px;
        overflow: hidden;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16);
        transition: box-shadow 0.15s, transform 0.08s;
        outline: ${selected ? `3px solid ${primary}` : "none"};
        outline-offset: -3px;
        ${selected ? "z-index: 1;" : ""}
        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
          transform: translateY(-1px);
        }
      `}
    >
      {(!isLoaded || !isVisible) && (
        <Skeleton
          variant="rectangular"
          css={css`
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
          `}
        />
      )}
      {isVisible && (
        <img
          src={tile.image.thumbnailUrl}
          onLoad={() => setIsLoaded(true)}
          css={css`
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            /* The tile box already matches the image aspect ratio, so cover
               fills it edge-to-edge without actually cropping the composition. */
            object-fit: cover;
            display: block;
          `}
        />
      )}
      {selected && (
        <div
          css={css`
            position: absolute;
            top: 7px;
            right: 7px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: ${primary};
            color: #fff;
            display: grid;
            place-items: center;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          `}
        >
          <CheckIcon
            css={css`
              font-size: 16px;
            `}
          />
        </div>
      )}
    </div>
  );
};

export const SearchResults: React.FunctionComponent<{
  images: IImage[];
  handleSelection: (item: IImage | undefined) => void;
  isLoading: boolean;
  error?: string;
  onBottomReached?: () => void;
  // thumbnailUrl of the currently selected image, so its tile gets the ring/badge
  selectedImageKey?: string;
}> = (props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure the usable content width (scrollbar excluded) so the justified rows
  // can be scaled to fill it; recompute whenever the panel is resized.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

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

  const rows = computeJustifiedRows(props.images, containerWidth);

  return (
    <ErrorBoundary>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        css={css`
          flex: 1;
          min-height: 0;
          position: relative;
          /* scroll (not auto): always reserve the scrollbar so the width the
             ResizeObserver measures is stable. With justified rows the row
             height depends on the available width, so a scrollbar that appears
             and disappears at an exact-fit boundary could otherwise oscillate. */
          overflow-y: scroll;
          padding-right: 4px;
        `}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            css={css`
              display: flex;
              gap: ${kRowGap}px;
              margin-bottom: ${kRowGap}px;
            `}
          >
            {row.map((tile) => (
              <JustifiedTile
                key={tile.image.thumbnailUrl}
                tile={tile}
                selected={tile.image.thumbnailUrl === props.selectedImageKey}
                onSelect={props.handleSelection}
              />
            ))}
          </div>
        ))}
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
