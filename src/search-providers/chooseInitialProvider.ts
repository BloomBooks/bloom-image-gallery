import { ISearchProvider } from "./imageProvider";

/** The provider id the gallery stamps on an image the user opened from their own disk. */
export const kLocalDiskProviderId = "local-disk";

/**
 * Decides whether accepting an image from acceptedProviderId changes the source the gallery
 * should open on next time. Returns the new source's id, or undefined when nothing changes:
 * a file from disk is not a source the gallery can open on, and accepting from the source that
 * is already preferred changes nothing.
 */
export function newPreferredProviderId(
  acceptedProviderId: string | undefined,
  currentPreferredId: string | undefined,
): string | undefined {
  if (!acceptedProviderId || acceptedProviderId === kLocalDiskProviderId) {
    return undefined;
  }
  return acceptedProviderId === currentPreferredId
    ? undefined
    : acceptedProviderId;
}

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
