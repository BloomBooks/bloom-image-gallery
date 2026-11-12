import { ISearchProvider } from "./imageProvider";

/**
 * Decides which source the gallery should select when it opens.
 *
 * Sources arrive one at a time (local collections and Pixabay only after an async fetch), so
 * this is asked again as each one arrives. With no preferred source it picks the first one at
 * once, as the gallery always has. With a preferred source it waits for that source to show
 * up; once it has, it is chosen if it can be used now. If it never shows up, or cannot be used
 * (Pixabay without an API key), the first source is chosen once all sources have loaded.
 *
 * Returns undefined while it is still worth waiting.
 */
export function chooseInitialProvider(
  providers: ISearchProvider[],
  preferredProviderId: string | undefined,
  allProvidersLoaded: boolean,
): ISearchProvider | undefined {
  if (providers.length === 0) return undefined;
  if (!preferredProviderId) return providers[0];
  const preferred = providers.find((p) => p.id === preferredProviderId);
  if (preferred?.isReady) return preferred;
  if (preferred || allProvidersLoaded) return providers[0];
  return undefined;
}
