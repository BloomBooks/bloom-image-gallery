export interface BloomMediaMetadata {
  url: string;
  licenseUrl?: string;
  license?: LicenseType;
  credits?: string;
  sourceWebPage?: string;
  localPath?: string;
}

export type LicenseType =
  | "CC-BY"
  | "CC-BY-ND"
  | "CC-BY-SA"
  | "CC-BY-NC"
  | "CC-BY-NC-ND"
  | "CC-BY-NC-SA"
  | "CC0"
  | "Public Domain"
  | "Site Specific";

// NB: must match what the Bloom Helper extension is sending us
export type DownloadRecord = {
  urlOfPage: string;
  url: string;
  filename: string;
  when: Date;
  // The extension can't find out the actual save location,
  // so we are assuming it is the user's download folder.
  // the extension can't know that either, so in the server we
  // get that, add the file name, and come up with this.
  computedLocalSavedPath: string;
};
