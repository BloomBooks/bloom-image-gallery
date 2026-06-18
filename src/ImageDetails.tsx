import { css } from "@emotion/react";
import React, { useEffect, useState } from "react";
import { IImage } from "./search-providers/imageProvider";
import { useL10n } from "./localization";

export const ImageDetails: React.FunctionComponent<{
  image?: IImage;
}> = (props) => {
  const l10n = useL10n();
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
      <div
        css={css`
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          min-width: 280px;
          min-height: 0;
          margin-left: 10px;
          padding-right: 10px;
          overflow: hidden;
        `}
      >
        {/* Wrapper sizes to image height, capped so it doesn't fill the whole panel */}
        <div
          css={css`
            flex-shrink: 0;
            min-height: 100px;
            max-height: 420px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
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
              max-height: 420px;
              max-width: 100%;
              min-width: 0;
              object-fit: contain;
            `}
          />
        </div>
        <div
          css={css`
            text-align: center;
            color: #3a3a3a;
            margin-top: 10px;
          `}
        >
          {dimensions.width > 0 && dimensions.height > 0 && (
            <>
              {dimensions.width} x {dimensions.height}
            </>
          )}
          {fileSize > 0 && (
            <>
              <br />
              {getUserFriendlySize(fileSize)}
            </>
          )}
          {props.image.creator && (
            <>
              <br />
              <span css={css`font-size: 0.85em; color: #666;`}>{l10n("ImageLibrary.PhotogrIllustrator", "Photographer/Illustrator:")} </span>
              {props.image.creator}
            </>
          )}
          {props.image.credits && (
            <>
              <br />
              <span css={css`font-size: 0.85em; color: #666;`}>{l10n("Common.Copyright", "Copyright")}: </span>
              {props.image.credits}
            </>
          )}
          {props.image.license && (
            <>
              <br />
              {props.image.licenseUrl ? (
                <a
                  href={props.image.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {props.image.license}
                </a>
              ) : (
                props.image.license
              )}
            </>
          )}
          {props.image.sourceWebPage && (
            <>
              <br />
              <a
                href={props.image.sourceWebPage}
                target="_blank"
                rel="noreferrer"
                title={props.image.sourceWebPage}
              >
                {props.image.sourceWebPageLabel || l10n("ImageLibrary.Source", "Source")}
              </a>
            </>
          )}
        </div>
      </div>
    )
  );
};
