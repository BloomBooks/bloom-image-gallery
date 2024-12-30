export interface IImageCollectionProvider {
  local?: boolean;
  label: string;
  id: string;
  logo?: string;
  languages?: string[];
  needsApiUrl?: string;
  search(searchTerm: string, language: string): Promise<ISearchResult>;
  checkReadiness?(): Promise<IImageCollectionProvider>;
}

export interface ISearchResult {
  images: IImage[];
  error?: string;
}

// enhance: an Image could be an array of different available sizes (e.g. pixabay has several), and the user could choose
export interface IImage {
  thumbnailUrl: string;
  reasonableSizeUrl?: string;
  webSiteUrl?: string;
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
