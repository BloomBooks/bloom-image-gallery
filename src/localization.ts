import React, { useCallback, useContext } from "react";

export type L10nFunc = (
  id: string,
  english: string,
  p0?: string,
  p1?: string
) => string;

function applyParams(s: string, p0?: string, p1?: string): string {
  if (p0 !== undefined) s = s.replace("{0}", p0);
  if (p1 !== undefined) s = s.replace("{1}", p1);
  return s;
}

const defaultL10n: L10nFunc = (_id, english, p0, p1) =>
  applyParams(english, p0, p1);

export const LocalizationContext =
  React.createContext<L10nFunc>(defaultL10n);

export function useL10n(): L10nFunc {
  return useContext(LocalizationContext);
}

/** Every user-visible string in the gallery, keyed by localization ID with English as the default value.
 *  The gallery passes this to getLocalizations on mount to fetch all translations in one round-trip. */
export const ALL_GALLERY_STRINGS: Record<string, string> = {
  // Reused from Bloom's existing strings
  "Common.Cancel": "Cancel",
  "Common.Copyright": "Copyright",
  "EditTab.PasteButton": "Paste",

  // Image library strings
  "ImageLibrary.AboutArtOfReading": "About Art of Reading",
  "ImageLibrary.AboutOpenVerse": "About OpenVerse",
  "ImageLibrary.AboutPixabay": "About Pixabay",
  "ImageLibrary.ArtOfReadingDescription":
    "International Illustrations: Art of Reading 3.0 is a collection of over 11,000 images. The collection is designed for use in the preparation of a wide variety of literacy and educational materials, such as shellbooks, primers, news-sheets, posters, and other culturally appropriate materials. These images are black and white line drawings collected from SIL and national artists from around the world.",
  "ImageLibrary.ArtOfReadingNotReadyInstructions":
    "To get Art of Reading images, you need to:",
  "ImageLibrary.CollectionsOnThisComputer": "Collections on this Computer",
  "ImageLibrary.Disclaimer":
    "These images are not from Bloom or SIL. This tool requests images suitable for general audiences. However, we cannot guarantee that all images will be inoffensive.",
  "ImageLibrary.DownloadArtOfReading":
    "Download and install the Art of Reading Installer",
  "ImageLibrary.ImageCount": "{0} images",
  "ImageLibrary.MoreInfo": "More info",
  "ImageLibrary.NoMatchesFound": "No matches found",
  "ImageLibrary.NotReady": "Not Ready",
  "ImageLibrary.OnlineSources": "Online Sources",
  "ImageLibrary.OpenFile": "Open File...",
  "ImageLibrary.OpenVerseDescription":
    "Openverse searches multiple public repositories for CC-licensed and public domain works.",
  "ImageLibrary.PasteApiKeyFromClipboard": "Paste API key from clipboard",
  "ImageLibrary.PhotogrIllustrator": "Photographer/Illustrator:",
  "ImageLibrary.PixabayApiKeyInstructions":
    "To use Pixabay, you need an API key:",
  "ImageLibrary.PixabayApiKeyLabel": "Pixabay API Key",
  "ImageLibrary.PixabayDescription":
    "Pixabay is a large collection of images that may be used for free without attribution.",
  "ImageLibrary.PixabayLogIn": "Log in to Pixabay",
  "ImageLibrary.PixabayOrIfLoggedIn": "or, if already logged in,",
  "ImageLibrary.PixabayGoToApiKeyPage": "go to the API key page",
  "ImageLibrary.PixabayFindKey":
    'Copy the API key shown on that page, next to "Your API key:"',
  "ImageLibrary.PixabayStep4": "Paste it below",
  "ImageLibrary.QuitAndRerunBloom": "Quit and re-run Bloom",
  "ImageLibrary.Refresh": "Refresh",
  "ImageLibrary.Search": "Search",
  "ImageLibrary.Source": "Source",
  "ImageLibrary.ThisComputer": "This Computer",
  "ImageLibrary.ThisPage": "this page",
  "ImageLibrary.UseThisImage": "Use this image",
};

/** Build a memoized l10n function from a translations dictionary. */
export function useL10nFromTranslations(
  translations: Record<string, string>
): L10nFunc {
  return useCallback(
    (id: string, english: string, p0?: string, p1?: string): string =>
      applyParams(translations[id] ?? english, p0, p1),
    [translations]
  );
}
