import { Alert } from "@mui/material";
import React from "react";

export interface IImageCollectionProvider {
  local?: boolean;
  label: string;
  id: string;
  logo?: string;
  languages?: string[];
  needsApiUrl?: string;
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
