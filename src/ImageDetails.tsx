import { css } from "@emotion/react";
import React, { useEffect } from "react";
import { IImage } from "./providers/imageProvider";

export const ImageDetails: React.FunctionComponent<{
  image?: IImage;
}> = (props) => {
  function getUserFriendlySize(size: number): string {
    const ksize = size / 1024.0;
    if (ksize < 10) return size.toString();
    if (ksize < 1024)
      return (
        Number(Math.round(parseFloat(`${ksize}e2`)) + "e-2").toString() + "K"
      );
    const msize = ksize / 1024.0;
    return (
      Number(Math.round(parseFloat(`${msize}e2`)) + "e-2").toString() + "M"
    );
  }

  useEffect(() => {
    console.log(`ImageDetails ${JSON.stringify(props.image, null, 2)}`);
  }, [props.image]);
  return (
    props.image && (
      <div
        css={css`
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          width: 300px;
          margin-left: 10px;
          //max-height: 100%;
        `}
      >
        <img
          id={"details-image"}
          //onLoad={imageLoaded}
          src={props.image.reasonableSizeUrl}
          css={css`
            margin-bottom: 15px;
            max-height: calc(100vh - 200px);
            object-fit: contain;
          `}
        />
        <div
          css={css`
            text-align: center;
          `}
        >
          {props.image.width}x{props.image.height}
          <br></br>
          {props.image.size > 0 ? getUserFriendlySize(props.image.size) : ""}
          {props.image.creator && (
            <>
              <br />
              Creator: {props.image.creator}
            </>
          )}
          {props.image.license && (
            <>
              <br />
              License: {props.image.license}
            </>
          )}
        </div>
      </div>
    )
  );
};
