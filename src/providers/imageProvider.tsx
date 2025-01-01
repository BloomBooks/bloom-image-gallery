import { Alert, Typography } from "@mui/material";
import React, { PropsWithChildren } from "react";

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

export const ProviderSummary = ({ children }: PropsWithChildren<{}>) => {
  return (
    <Typography
      variant="body1"
      sx={{
        backgroundColor: "#f5f5f5",
        padding: 2,
        borderRadius: 1,
        border: "1px solid #e0e0e0",
        marginBottom: 2,
      }}
    >
      {children}
    </Typography>
  );
};
