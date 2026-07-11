import { css } from "@emotion/react";
import { useTheme } from "@mui/material/styles";
import { OpenInNew as OpenInNewIcon } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { IImage } from "./search-providers/imageProvider";
import { useL10n } from "./localization";

// One label/value line in the attribution list: muted grey label on the left,
// darker medium-weight value right-aligned.
const AttrRow: React.FunctionComponent<{
  label: string;
  value: React.ReactNode;
  last?: boolean;
}> = (props) => {
  const theme = useTheme();
  return (
    <div
      css={css`
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 13.5px;
        padding: 8px 0;
        border-bottom: ${props.last ? "none" : `1px solid ${theme.palette.divider}`};
      `}
    >
      <span
        css={css`
          color: ${theme.palette.text.secondary};
        `}
      >
        {props.label}
      </span>
      <span
        css={css`
          color: ${theme.palette.text.primary};
          text-align: right;
          font-weight: 500;
        `}
      >
        {props.value}
      </span>
    </div>
  );
};

export const ImageDetails: React.FunctionComponent<{
  image?: IImage;
}> = (props) => {
  const l10n = useL10n();
  const theme = useTheme();
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [fileSize, setFileSize] = useState<number>(0);

  function getUserFriendlySize(size: number): string {
    const ksize = size / 1024.0;
    if (ksize < 10) return Math.round(size).toString();
    if (ksize < 1024) return Math.round(ksize) + "K";
    const msize = ksize / 1024.0;
    return Math.round(msize) + "M";
  }

  useEffect(() => {
    // Prefer the original image's size reported by the provider. Only fall back to
    // measuring the preview image (reasonableSizeUrl) when the provider didn't supply one.
    if (props.image?.size) {
      setFileSize(props.image.size);
    } else if (props.image?.reasonableSizeUrl) {
      fetch(props.image.reasonableSizeUrl, { method: "HEAD" })
        .then((response) => {
          const size = response.headers.get("content-length");
          setFileSize(size ? parseInt(size, 10) : 0);
        })
        .catch((err) => console.error("Error fetching image size:", err));
    }
  }, [props.image]);

  // Prefer the original image's dimensions reported by the provider; otherwise fall back
  // to whatever the preview image turns out to be once it loads.
  useEffect(() => {
    if (props.image?.width && props.image?.height) {
      setDimensions({ width: props.image.width, height: props.image.height });
    } else {
      setDimensions({ width: 0, height: 0 });
    }
  }, [props.image]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (props.image?.width && props.image?.height) return;
    const img = e.currentTarget;
    setDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  return (
    props.image && (
      <>
        {/* Preview image on top. Wrapper sizes to the image height, capped so it
            leaves room for the attribution list below. */}
        <div
          css={css`
            flex-shrink: 0;
            min-height: 100px;
            max-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border-radius: 6px;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
            background-image: linear-gradient(45deg, #eee 25%, transparent 25%),
              linear-gradient(-45deg, #eee 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #eee 75%),
              linear-gradient(-45deg, transparent 75%, #eee 75%);
            background-size: 20px 20px;
            background-position:
              0 0,
              0 10px,
              10px -10px,
              -10px 0px;
          `}
        >
          <img
            id={"details-image"}
            onLoad={handleImageLoad}
            src={props.image.reasonableSizeUrl}
            css={css`
              display: block;
              max-height: 300px;
              max-width: 100%;
              min-width: 0;
              object-fit: contain;
            `}
          />
        </div>

        {/* Attribution: a clean two-column label/value list. */}
        <div>
          {dimensions.width > 0 && dimensions.height > 0 && (
            <AttrRow
              label={l10n("ImageLibrary.Dimensions", "Dimensions")}
              value={`${dimensions.width} × ${dimensions.height}`}
            />
          )}
          {fileSize > 0 && (
            <AttrRow
              label={l10n("ImageLibrary.FileSize", "File size")}
              value={getUserFriendlySize(fileSize)}
            />
          )}
          {props.image.creator && (
            <AttrRow
              label={l10n(
                "Copyright.IllustratorOrPhotographer",
                "Illustrator/Photographer"
              )}
              value={props.image.creator}
            />
          )}
          {props.image.credits && (
            <AttrRow
              label={l10n("Common.Copyright", "Copyright")}
              value={props.image.credits}
            />
          )}
          {props.image.license && (
            <AttrRow
              label={l10n("ImageLibrary.License", "License")}
              last
              value={
                props.image.licenseUrl ? (
                  <a
                    href={props.image.licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                    css={css`
                      color: ${theme.palette.primary.dark};
                      text-decoration: none;
                      font-weight: 500;
                    `}
                  >
                    {props.image.license}
                  </a>
                ) : (
                  props.image.license
                )
              }
            />
          )}
        </div>

        {/* "View on <source>" external link below the list. */}
        {props.image.sourceWebPage && (
          <a
            href={props.image.sourceWebPage}
            target="_blank"
            rel="noreferrer"
            title={props.image.sourceWebPage}
            css={css`
              display: inline-flex;
              align-items: center;
              gap: 7px;
              color: ${theme.palette.primary.dark};
              font-size: 14px;
              text-decoration: none;
              font-weight: 500;
            `}
          >
            <OpenInNewIcon
              css={css`
                font-size: 16px;
              `}
            />
            {props.image.sourceWebPageLabel ||
              l10n("ImageLibrary.Source", "Source")}
          </a>
        )}
      </>
    )
  );
};
