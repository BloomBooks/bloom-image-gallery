import { Alert } from "@mui/material";
import React from "react";

export interface IImageCollectionProvider {
  local?: boolean;
  label: string;
  id: string;
  logo?: string;
  languages?: string[];
  isReady: boolean;
  justAListNoQuery?: boolean; // browser-queue sets this to true
  search(
    searchTerm: string,
    pageZeroIndexed: number,
    language: string
  ): Promise<ISearchResult>;
  checkReadiness?(): Promise<IImageCollectionProvider>;
  aboutComponent?(): JSX.Element;
}

export interface ISearchResult {
  images: IImage[];
  totalImages?: number;
  error?: string;
}

// enhance: an Image could be an array of different available sizes (e.g. pixabay has several), and the user could choose
export interface IImage {
  thumbnailUrl: string;
  reasonableSizeUrl?: string;
  sourceWebPage?: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  license?: string;
  licenseUrl?: string;
  creator?: string;
  creatorUrl?: string;
  raw?: object;
}

export const StandardDisclaimer: React.FunctionComponent<{}> = () => {
  return (
    <Alert severity="warning">
      These images are not from Bloom or SIL. This tool requests images suitable
      for general audiences. However, we cannot guarantee that all images will
      be inoffensive.
    </Alert>
  );
};

/*

  {!selectedProvider?.isReady && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                margin: "20px",
              }}
            >
              <Typography variant="caption">
                {`(This is a message for developers. For users, we'll either need a UI for pasting in or we'll provide the keys via our server.)`}
                <br />
                <br />
                {`Before you can use ${selectedProvider?.label}, you will need to obtain a free API key from them for at `}
                <br />
                <br />
                {`Once you have the key, put it in an environment variable named ${selectedProvider?.label}. Remember to restart the app or dev environment after setting the key.`}
              </Typography>
            </Box>
          )}
            */
