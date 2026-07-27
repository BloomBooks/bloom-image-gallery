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

  // Chromium refuses outright to decode an image whose pixel count times 4 bytes/pixel
  // overflows a signed 32-bit int, firing "error" instead of "load"; decoding at a reduced
  // size doesn't help, because the limit is checked against the natural size. Rather than
  // leave an empty box we explain it (BL-16597).
  const kMaxBrowserDecodablePixels = 536870911; // int32 max / 4 bytes per pixel

  // Which src failed, rather than a bare "it failed" flag. Deriving the state from the
  // current src means selecting a different image is correct on the very first render; a
  // flag reset in an effect would paint one frame of the previous image's message first.
  const [failedUrl, setFailedUrl] = useState<string | undefined>(undefined);
  const currentUrl = props.image?.reasonableSizeUrl;
  const previewFailed = !!currentUrl && failedUrl === currentUrl;

  // An image is only known to be too big when the provider told us its dimensions. Any
  // other load failure — a dead hotlink, a 404, no network — must not claim that, and in
  // particular must not promise the image is still usable, because it isn't.
  const tooLargeToDecode =
    !!props.image?.width &&
    !!props.image?.height &&
    props.image.width * props.image.height > kMaxBrowserDecodablePixels;

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
          {previewFailed ? (
            <div
              css={css`
                padding: 20px;
                text-align: center;
                color: #666;
                font-size: 0.9em;
              `}
            >
              {tooLargeToDecode
                ? l10n(
                    "ImageLibrary.PreviewTooLarge",
                    "This image is too large to preview here, but you can still use it."
                  )
                : l10n(
                    "ImageLibrary.PreviewUnavailable",
                    "This image could not be previewed."
                  )}
            </div>
          ) : (
            <img
              id={"details-image"}
              onLoad={handleImageLoad}
              onError={() => setFailedUrl(currentUrl)}
              src={props.image.reasonableSizeUrl}
              css={css`
                display: block;
                max-height: 420px;
                max-width: 100%;
                min-width: 0;
                object-fit: contain;
              `}
            />
          )}
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
              <span css={css`font-size: 0.85em; color: #666;`}>{l10n("Copyright.IllustratorOrPhotographer", "Illustrator/Photographer")}: </span>
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
