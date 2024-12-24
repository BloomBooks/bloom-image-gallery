import { css } from "@emotion/react";
import axios from "axios";
import React, { useState, useEffect } from "react";

export const ImageDetails: React.FunctionComponent<{
  collection?: string;
  imageFile?: string;
  chosenFile?: string;
}> = (props) => {
  const [imageProps, setImageProps] = useState({ size: 0, type: "" });
  const [imageDimensions, setImageDimensions] = useState("");

  let uriSearch: string = "";
  let imgSrc: string = "";
  if (props.collection && props.imageFile) {
    uriSearch = `http://localhost:5000/image-toolbox/collection-image-properties/${props.collection.replaceAll(
      " ",
      "%20"
    )}/${props.imageFile}`;
    imgSrc = `http://localhost:5000/image-toolbox/collection-image-file/${props.collection}/${props.imageFile}`;
  } else if (props.chosenFile) {
    uriSearch = `http://localhost:5000/image-toolbox/image-properties/${encodeURIComponent(
      props.chosenFile
    )}`;
    imgSrc = `http://localhost:5000/image-toolbox/image-file/${encodeURIComponent(
      props.chosenFile
    )}`;
  }

  useEffect(() => {
    if ((props.collection && props.imageFile) || props.chosenFile) {
      axios
        .get(uriSearch)
        .then((response) => {
          setImageProps(response.data);
        })
        .catch((reason) => {
          console.log(
            `axios call image-toolbox/image-properties failed: ${reason}`
          );
          setImageProps({ size: 0, type: "" });
          setImageDimensions("");
        });
    } else {
      setImageProps({ size: 0, type: "" });
      setImageDimensions("");
    }
  }, [props.collection, props.imageFile, props.chosenFile]);

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
        src={imgSrc}
        alt={imgSrc}
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
