import { css } from "@emotion/react";
import { Divider } from "@mui/material";
import React, { useEffect } from "react";
import { ImageDetails } from "./ImageDetails";
import { ImageSearch } from "./ImageSearch";

export const ImageScreen: React.FunctionComponent<{
  collection: string;
  lang: string;
  chosenFileUrl?: string;
}> = (props) => {
  const [selectedImage, setSelectedImage] = React.useState("");

  function handleSearchSelection(item: string) {
    setSelectedImage(item);
  }

  useEffect(() => {
    setSelectedImage("");
  }, [props.collection]);

  return (
    <div
      css={css`
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 500px; // enhance
        padding: 20px;
      `}
    >
      <ImageSearch
        collection={props.collection}
        lang={props.lang}
        handleSelection={handleSearchSelection}
      />
      <Divider orientation="vertical" flexItem />
      <ImageDetails
        collection={props.collection}
        imageFile={selectedImage}
        chosenFileUrl={props.chosenFileUrl}
      />
    </div>
  );
};
