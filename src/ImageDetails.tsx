import { css } from "@emotion/react";
import React, { useEffect, useState } from "react";
import { IImage } from "./providers/imageProvider";

export const ImageDetails: React.FunctionComponent<{
  image?: IImage;
}> = (props) => {
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
    console.log(`ImageDetails ${JSON.stringify(props.image, null, 2)}`);
  }, [props.image]);

  useEffect(() => {
    if (props.image?.reasonableSizeUrl) {
      fetch(props.image.reasonableSizeUrl, { method: "HEAD" })
        .then((response) => {
          const size = response.headers.get("content-length");
          setFileSize(size ? parseInt(size, 10) : 0);
        })
        .catch((err) => console.error("Error fetching image size:", err));
    }
  }, [props.image]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
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
          width: 300px;
          margin-left: 10px;
        `}
      >
        <img
          id={"details-image"}
          onLoad={handleImageLoad}
          src={props.image.reasonableSizeUrl}
          css={css`
            display: block;
            max-height: calc(100vh - 200px);
            object-fit: contain;
            width: 100%;
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
        />
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
              {props.image.creator}
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
          {props.image.webSiteUrl && (
            <>
              <br />
              <a
                href={props.image.webSiteUrl}
                target="_blank"
                rel="noreferrer"
                title={props.image.webSiteUrl}
              >
                Source
              </a>
            </>
          )}
        </div>
      </div>
    )
  );
};
