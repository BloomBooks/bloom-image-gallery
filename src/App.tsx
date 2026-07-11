/// <reference types="@types/wicg-file-system-access" />
import { css } from "@emotion/react";
import React, { useEffect, useRef, useState } from "react";
import {
  ALL_GALLERY_STRINGS,
  LocalizationContext,
  useL10nFromTranslations,
} from "./localization";

import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Button,
} from "@mui/material";
import { createTheme, ThemeProvider, alpha } from "@mui/material/styles";
import { Folder as FolderIcon } from "@mui/icons-material";
import { ImageDetails } from "./ImageDetails";
import { ImageSearch, About } from "./ImageSearch";
import { Pixabay } from "./search-providers/PixabayProvider";
import { OpenVerse } from "./search-providers/OpenVerseProvider";
// import { Europeana } from "./search-providers/EuropeanaProvider";
// import { WikipediaProvider } from "./search-providers/WikipediaProvider";
// import { BrowserExtensionQueueProvider } from "./search-providers/BrowserExtensionHistoryProvider";
import {
  ISearchProvider,
  IImage,
  StandardDisclaimer,
} from "./search-providers/imageProvider";
import { ArtOfReadingProvider } from "./search-providers/ArtOfReadingProvider";
import { basePathPrefix, port } from "../common/locations";
import axios from "axios";
import { IProviderKeysV1 } from "../common/bloomMediaMetadata";

const drawerWidth = 216;

export interface IImageGalleryProps {
  /** Called when the user confirms an image selection; host should insert the image. */
  onConfirmSelection: (image: IImage) => void;
  /** Called when the user clicks the button to open a file; host opens a file picker and returns the chosen image.
   *  If omitted, a browser file-input dialog is used as a fallback. */
  onPickLocalFile?: () => Promise<IImage | undefined>;
  /** Called when the user cancels without selecting an image. */
  onCancel?: () => void;
  /** Base URL for the local image collections service (the path up to but not including
   *  "/local-collections/..."). When provided the gallery enumerates all installed
   *  collections under that URL and creates one provider entry per collection. */
  localCollectionsBaseUrl?: string;
  /** BCP 47 language tag for search queries (e.g. "en", "fr"). Defaults to "en". */
  lang?: string;
  /** Versioned bundle of provider API keys loaded from the host's durable storage. */
  initialProviderKeys?: IProviderKeysV1;
  /** Called whenever a provider key is added or changed; host should persist the bundle. */
  onProviderKeysChange?: (keys: IProviderKeysV1) => void;
  /** Called when the user changes the search language; host should persist the new value. */
  onLanguageChange?: (lang: string) => void;
  /** Primary color for buttons, selection highlights, links, etc. (hex string, e.g. "#1d94a4"). */
  primaryColor?: string;
  /** Called once at mount with all gallery string IDs and their English defaults.
   *  Should return a dictionary of translated strings for the current UI language.
   *  Missing keys fall back to the English defaults. */
  getLocalizations?: (
    strings: Record<string, string>
  ) => Promise<Record<string, string>>;
}

function App(props: IImageGalleryProps) {
  const [providerVersion, setProviderVersion] = useState(0);
  const [imageProviders, setImageProviders] = useState<ISearchProvider[]>([]);

  const addToImageProviders = (provider: ISearchProvider) => {
    setImageProviders((prev) => {
      if (!prev.find((p) => p.id === provider.id)) {
        return [...prev, provider];
      }
      return prev;
    });
  };

  // Initialize built-in providers
  useEffect(() => {
    const initProviders = async () => {
      const forceUpdate = () => setProviderVersion((v) => v + 1);
      const pixabay = new Pixabay({
        initialKey: props.initialProviderKeys?.pixabay,
        onKeyChange: (key) =>
          props.onProviderKeysChange?.({ version: 1, pixabay: key }),
      });
      pixabay.onReadyStateChange = forceUpdate;
      addToImageProviders(new OpenVerse());
      // addToImageProviders(new WikipediaProvider());
      // Discover local image collections (e.g. Art of Reading) from the host.
      // Each collection becomes its own provider entry.
      const collectionsBaseUrl =
        props.localCollectionsBaseUrl ??
        `http://localhost:${port}${basePathPrefix}`;
      try {
        const response = await axios.get(
          `${collectionsBaseUrl}/local-collections/collections`
        );
        type CollectionMeta = {
          name: string;
          licenseUrl?: string;
          credits?: string;
        };
        const { collections, languages } = response.data as {
          // The server returns objects {name, licenseUrl, credits}; accept plain strings
          // too for backward compatibility with older dev servers.
          collections: (CollectionMeta | string)[];
          languages?: string[];
        };
        for (const item of collections) {
          const name = typeof item === "string" ? item : item.name;
          const licenseUrl = typeof item === "object" ? item.licenseUrl : undefined;
          const credits = typeof item === "object" ? item.credits : undefined;
          const provider = new ArtOfReadingProvider(
            name,
            collectionsBaseUrl,
            licenseUrl,
            credits
          );
          provider.isReady = true;
          provider.languages = languages ?? ["en"];
          addToImageProviders(provider);
        }
      } catch {
        // No local collections available (e.g. server not running in dev).
      }
      // addToImageProviders(new BrowserExtensionQueueProvider());
      addToImageProviders(pixabay);
      // addToImageProviders(await new Europeana().checkReadiness());
    };
    initProviders();
  }, []); // Only run once on mount

  const [selectedProvider, setSelectedProvider] = useState<
    ISearchProvider | undefined
  >(undefined);

  const [translations, setTranslations] = useState<Record<string, string>>({});
  const l10n = useL10nFromTranslations(translations);

  useEffect(() => {
    if (!props.getLocalizations) return;
    props.getLocalizations(ALL_GALLERY_STRINGS).then(setTranslations);
  }, []); // run once on mount; UI language changes require a Bloom restart

  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickLocalFile = async () => {
    let image: IImage | undefined;
    if (props.onPickLocalFile) {
      image = await props.onPickLocalFile();
    } else {
      image = await new Promise<IImage | undefined>((resolve) => {
        const input = fileInputRef.current!;
        const onchange = (e: Event) => {
          input.removeEventListener("change", onchange);
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) { resolve(undefined); return; }
          const objectUrl = URL.createObjectURL(file);
          resolve({
            thumbnailUrl: objectUrl,
            reasonableSizeUrl: objectUrl,
            url: objectUrl,
            size: file.size,
            type: file.type,
            localPath: file.name,
          });
          input.value = "";
        };
        input.addEventListener("change", onchange);
        input.click();
      });
    }
    if (image) {
      setSelectedProvider(undefined);
      setSelectedImage(image);
    }
  };

  const [selectedImage, setSelectedImage] = React.useState<IImage | undefined>(
    undefined
  );

  useEffect(() => {
    // select an initial collection. Note that if selectedProvider is null, then that means we don't want a selection
    if (selectedProvider === undefined && imageProviders.length > 0) {
      setSelectedProvider(imageProviders[0]);
    }
  }, [imageProviders]);

  function handleSelectCollection(provider: ISearchProvider) {
    setSelectedProvider(provider);
  }

  const theme = createTheme(
    props.primaryColor
      ? {
          palette: { primary: { main: props.primaryColor } },
          components: {
            MuiButton: { styleOverrides: { root: { textTransform: "none" } } },
          },
        }
      : {}
  );
  const primaryColor = theme.palette.primary.main;
  const primaryDark = theme.palette.primary.dark;

  // Small grey uppercase section label in the sidebar.
  const sidebarHeadingStyle = css`
    margin-top: 18px;
    padding-top: 0;
    padding-bottom: 0;
    padding-left: 6px;
    padding-right: 6px;
    span {
      color: ${theme.palette.text.secondary};
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
  `;

  // The first heading has no section above it, so it uses a smaller top margin.
  const firstSidebarHeadingStyle = css`
    ${sidebarHeadingStyle}
    margin-top: 4px;
  `;

  // A source/collection row: plain with a subtle hover tint, and a soft
  // primary-tinted rounded "pill" (with primary text) when selected. The
  // sidebar's own horizontal padding gives the pill its inset from the edges.
  const sourceItemSx = {
    borderRadius: "8px",
    marginBottom: "2px",
    paddingLeft: "12px",
    paddingRight: "12px",
    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.045)" },
    "&.Mui-selected": {
      backgroundColor: alpha(primaryColor, 0.12),
      color: primaryDark,
      fontWeight: 500,
      "&:hover": { backgroundColor: alpha(primaryColor, 0.18) },
    },
  };

  // The right-hand pane (attribution when an image is selected, notices
  // otherwise): a fixed-width, full-height column with a soft grey background.
  const detailPaneStyle = css`
    width: 340px;
    flex: none;
    overflow-y: auto;
    border-left: 1px solid ${theme.palette.divider};
    background-color: ${theme.palette.grey[50]};
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  `;

  return (
    <LocalizationContext.Provider value={l10n}>
    <ThemeProvider theme={theme}>
      <Box
        css={css`
          height: 100%;
          display: flex;
          a {
            color: ${primaryColor};
          }
        `}
      >
        {/* Plain div sidebar — avoids MUI Drawer's position:fixed which escapes dialog bounds */}
        <div
          css={css`
            width: ${drawerWidth}px;
            flex-shrink: 0;
            height: 100%;
            overflow: auto;
            padding: 6px 8px;
            box-sizing: border-box;
            border-right: 1px solid ${theme.palette.divider};
          `}
          onClick={(e) => {
            // Only clear if clicking directly on the div, not its children
            if (e.target === e.currentTarget) {
              setSelectedProvider(undefined);
            }
          }}
        >
            <List disablePadding>
              <ListItem disableGutters css={firstSidebarHeadingStyle}>
                <ListItemText primary={l10n("ImageLibrary.ThisComputer", "This Computer")} />
              </ListItem>
              <ListItem disableGutters sx={{ px: "6px", pt: "2px" }}>
                {/* a Material UI button with a folder icon */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <Button
                  fullWidth
                  variant={selectedProvider ? "outlined" : "contained"}
                  startIcon={<FolderIcon />}
                  onClick={handlePickLocalFile}
                >
                  {l10n("ImageLibrary.OpenFile", "Open File...")}
                </Button>
              </ListItem>

              <ListItem disableGutters css={sidebarHeadingStyle}>
                <ListItemText primary={l10n("ImageLibrary.CollectionsOnThisComputer", "Collections on this Computer")} />
              </ListItem>
              {imageProviders
                ?.filter((p) => p.local)
                .map((provider) => (
                  <ListItemButton
                    key={provider.id}
                    onClick={() => handleSelectCollection(provider)}
                    selected={provider === selectedProvider}
                    dense
                    sx={{
                      ...sourceItemSx,
                      position: "relative",
                      // Add a semi-transparent overlay to show that it's not ready
                      "&::after": !provider.isReady
                        ? {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "#ffffff80",
                          }
                        : {},
                    }}
                  >
                    {provider.logo && (
                      <ListItemIcon sx={{ minWidth: 34 }}>
                        <img src={provider.logo} width={24} />
                      </ListItemIcon>
                    )}
                    <ListItemText primary={provider.label}></ListItemText>
                  </ListItemButton>
                ))}

              <ListItem disableGutters css={sidebarHeadingStyle}>
                <ListItemText
                  primary={l10n("ImageLibrary.OnlineSources", "Online Sources")}
                />
              </ListItem>
              {imageProviders
                ?.filter((p) => !p.local)
                .map((provider) => (
                  <ListItemButton
                    key={provider.id}
                    onClick={() => handleSelectCollection(provider)}
                    selected={provider === selectedProvider}
                    dense
                    sx={{
                      ...sourceItemSx,
                      position: "relative",
                      "&::after": !provider.isReady
                        ? {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "#ffffff80",
                            pointerEvents: "none",
                          }
                        : {},
                    }}
                  >
                    {provider.logo && (
                      <ListItemIcon sx={{ minWidth: 34 }}>
                        <img src={provider.logo} width={24} />
                      </ListItemIcon>
                    )}
                    <ListItemText primary={provider.label}></ListItemText>
                  </ListItemButton>
                ))}
            </List>
        </div>
        <Box
          component="main"
          css={css`
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 0;
            height: 100%;
          `}
        >
          {(selectedProvider || selectedImage) && (
            <div
              css={css`
                display: flex;
                flex-direction: column;
                height: 100%;
              `}
            >
              <div
                css={css`
                  display: flex;
                  flex-direction: row;
                  flex: 1;
                  min-height: 0;
                `}
              >
                <div
                  css={css`
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    padding: 20px 20px 0;
                  `}
                >
                  {selectedProvider && (
                    <ImageSearch
                      key={`${selectedProvider.id}-${providerVersion}`}
                      provider={selectedProvider}
                      lang={props.lang ?? "en"}
                      handleSelection={setSelectedImage}
                      selectedImageKey={selectedImage?.thumbnailUrl}
                      initialSearchTerm={searchTerm}
                      onSearchTermChange={setSearchTerm}
                      onLanguageChange={props.onLanguageChange}
                    />
                  )}
                </div>
                <div css={detailPaneStyle}>
                  {selectedImage ? (
                    <>
                      <ImageDetails image={selectedImage} />
                      {/* Keep the general-audiences disclaimer visible while an
                          image is selected too. Only for online sources: the text
                          ("not from Bloom or SIL") would be false for Art of
                          Reading or a local file. */}
                      {selectedProvider && !selectedProvider.local && (
                        <div
                          css={css`
                            margin-top: auto;
                          `}
                        >
                          <StandardDisclaimer />
                        </div>
                      )}
                    </>
                  ) : selectedProvider ? (
                    <>
                      <About
                        key={selectedProvider.id}
                        provider={selectedProvider}
                      />
                      <div
                        css={css`
                          margin-top: auto;
                          text-align: center;
                          color: ${theme.palette.text.disabled};
                          font-size: 13.5px;
                          padding: 20px;
                        `}
                      >
                        {l10n(
                          "ImageLibrary.SelectImagePrompt",
                          "Select an image to see its details and license."
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
              <div
                css={css`
                  display: flex;
                  flex-direction: row;
                  justify-content: flex-end;
                  gap: 8px;
                  padding: 14px 20px;
                  border-top: 1px solid ${theme.palette.divider};
                `}
              >
                {props.onCancel && (
                  <Button variant="outlined" onClick={props.onCancel}>
                    {l10n("Common.Cancel", "Cancel")}
                  </Button>
                )}
                <Button
                  variant="contained"
                  disabled={!selectedImage}
                  onClick={() =>
                    selectedImage && props.onConfirmSelection(selectedImage)
                  }
                >
                  {l10n("ImageLibrary.UseThisImage", "Use this image")}
                </Button>
              </div>
            </div>
          )}
        </Box>
      </Box>
    </ThemeProvider>
    </LocalizationContext.Provider>
  );
}

export default App;
