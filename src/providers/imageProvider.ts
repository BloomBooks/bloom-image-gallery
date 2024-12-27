export interface IImageCollectionProvider {
  label: string;
  id: string;
  logo?: string;
  languages?: string[];
  search(searchTerm: string, language: string): Promise<ISearchResult>;
}

export interface ISearchResult {
  images: IImage[];
  error?: string;
}

// enhance: an Image could be an array of different available sizes (e.g. pixabay has several), and the user could choose
export interface IImage {
  thumbnailUrl: string;
  reasonableSizeUrl?: string;
  size: number;
  type: string;
  license?: string;
  licenseUrl?: string;
  creator?: string;
  creatorUrl?: string;
  raw?: object;
}
