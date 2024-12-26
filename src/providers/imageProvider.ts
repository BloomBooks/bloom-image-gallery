export interface IImageCollectionProvider {
  label: string;
  id: string;
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
  width: number;
  height: number;
  raw?: object;
}