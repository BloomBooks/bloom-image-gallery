import { css } from "@emotion/react";
import axios from "axios";
import React, { useState, useEffect } from "react";

export const ImageDetails: React.FunctionComponent<{
  collectionId?: string;
  url?: string;
}> = (props) => {
  const [imageProps, setImageProps] = useState({ size: 0, type: "" });
  const [imageDimensions, setImageDimensions] = useState("");

  let uriSearch: string = "";

  useEffect(() => {
    if (props.collectionId && props.url) {
      axios
        .get(uriSearch)
        .then((response) => {
          setImageProps(response.data);
        })
        .catch((reason) => {
          console.log(
            `axios call /local-collections/image-properties failed: ${reason}`
          );
          setImageProps({ size: 0, type: "" });
          setImageDimensions("");
        });
    } else {
      setImageProps({ size: 0, type: "" });
      setImageDimensions("");
    }
  }, [props.collectionId, props.url]);

  function imageLoaded(event: React.SyntheticEvent<HTMLImageElement, Event>) {
    const image = document.getElementById("details-image") as HTMLImageElement;
    if (image) {
      setImageDimensions(
        `${image.naturalWidth} x ${image.naturalHeight} pixels`
      );
    } else {
      setImageDimensions("");
    }
  }

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

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        width: 300px;
        margin-left: 10px;
      `}
    >
      <img
        id={"details-image"}
        onLoad={imageLoaded}
        src={props.url}
        css={css`
          margin-bottom: 15px;
        `}
      />
      <div
        css={css`
          text-align: center;
        `}
      >
        {imageDimensions}
        <br></br>
        {imageProps.size > 0 ? getUserFriendlySize(imageProps.size) : ""}
        <br></br>
        {imageProps.type}
      </div>
    </div>
  );
};
