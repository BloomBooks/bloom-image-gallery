import { Alert, Typography } from "@mui/material";
import React, { PropsWithChildren } from "react";
import { BloomMediaMetadata } from "../../common/bloomMediaMetadata";

export interface ISearchProvider {
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
  checkReadiness?(): Promise<ISearchProvider>;
  aboutComponent?(): JSX.Element;
  onReadyStateChange?: () => void;
}

export interface ISearchResult {
  images: IImage[];
  totalImages?: number;
  error?: string;
}

// an IImage is the metadata we will need for storing with the image in Bloom, but also some things that are helpful
// in the image gallery tool for choosing images.
// enhance: an Image could be an array of different available sizes (e.g. pixabay has several), and the user could choose
export interface IImage extends BloomMediaMetadata {
  thumbnailUrl: string;
  reasonableSizeUrl?: string;
  sourceWebPage?: string;
  sourceWebPageLabel?: string; // link text for sourceWebPage; defaults to "Source"
  size: number;
  type: string;
  width?: number;
  height?: number;
  raw?: object;
}

export const StandardDisclaimer: React.FunctionComponent<{}> = () => {
  return (
    <Alert severity="info">
      These images are not from Bloom or SIL. This tool requests images suitable
      for general audiences. However, we cannot guarantee that all images will
      be inoffensive.
    </Alert>
  );
};

export const ProviderSummary = ({
  title,
  children,
}: PropsWithChildren<{ title?: string }>) => {
  return (
    <Typography
      component="div"
      variant="body1"
      sx={{
        backgroundColor: "#d1e5ff",
        padding: 2,
        borderRadius: 1,
        border: "1px solid #e0e0e0",
        marginTop: 2,
        marginBottom: 2,
      }}
    >
      {title && (
        <Typography
          component="div"
          sx={{ fontWeight: "bold", marginBottom: 1 }}
        >
          {title}
        </Typography>
      )}
      {children}
    </Typography>
  );
};
