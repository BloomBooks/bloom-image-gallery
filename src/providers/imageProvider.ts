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

export interface IImage {
  thumbnailUrl: string;
  reasonableSizeUrl?: string;
  size: number;
  type: string;
  width: number;
  height: number;
  raw?: object;
}
