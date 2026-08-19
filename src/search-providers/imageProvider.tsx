import { Alert, Typography } from "@mui/material";
import React, { PropsWithChildren } from "react";
import { useL10n } from "../localization";
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

// What the host is told about a completed search, so that it can record what people search
// for, which source they sent it to, and how much came back. Reported once per search, not
// once per page of results.
//
// Deliberately, a search IS reported again when the user keeps the term and changes only the
// language: the source is queried afresh and hands back different pictures, so it is another
// search by any measure the host cares about. It does mean one idea ("dog", tried in three
// languages) produces several reports, so a count of these is a count of queries, not of
// distinct things people looked for. The language is in every report, which is what lets
// anyone analysing them tell the two apart.
export interface ISearchReport {
  term: string;
  providerId: string;
  language: string;
  // The total the provider claims to have, if it reports one; otherwise the number returned.
  resultCount?: number;
  // Set when the search failed outright, and also when a provider reported a problem
  // alongside results it did manage to return -- so error and resultCount can both be set.
  error?: string;
}

// an IImage is the metadata we will need for storing with the image in Bloom, but also some things that are helpful
// in the image gallery tool for choosing images.
// enhance: an Image could be an array of different available sizes (e.g. pixabay has several), and the user could choose
export interface IImage extends BloomMediaMetadata {
  // Which ISearchProvider this image came from ("pixabay", "openverse", a local collection
  // slug, or "local-disk" for a file the user opened). The gallery stamps this on, so
  // providers do not have to; the host needs it to report where images actually come from.
  providerId?: string;
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
  const l10n = useL10n();
  return (
    <Alert severity="info">
      {l10n(
        "ImageLibrary.Disclaimer",
        "These images are not from Bloom or SIL. This tool requests images suitable for general audiences. However, we cannot guarantee that all images will be inoffensive."
      )}
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
