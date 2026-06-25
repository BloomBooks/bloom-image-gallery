/// <reference types="@types/wicg-file-system-access" />
import { css } from "@emotion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  Divider,
  ListItemButton,
  Button,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Folder as FolderIcon } from "@mui/icons-material";
import { ImageDetails } from "./ImageDetails";
import { ImageSearch, About } from "./ImageSearch";
import { Pixabay } from "./search-providers/PixabayProvider";
import { OpenVerse } from "./search-providers/OpenVerseProvider";
// import { Europeana } from "./search-providers/EuropeanaProvider";
// import { WikipediaProvider } from "./search-providers/WikipediaProvider";
// import { BrowserExtensionQueueProvider } from "./search-providers/BrowserExtensionHistoryProvider";
import { ISearchProvider, IImage } from "./search-providers/imageProvider";
import { ArtOfReadingProvider } from "./search-providers/ArtOfReadingProvider";
import { basePathPrefix, port } from "../common/locations";
import axios from "axios";
import { IProviderKeysV1 } from "../common/bloomMediaMetadata";

const drawerWidth = 200;

export interface IImageGalleryProps {
  /** Called when the user confirms an image selection; host should insert the image. */
  onConfirmSelection: (image: IImage) => void;
  /** Called when the user clicks the button to open a file; host opens a file picker and returns the chosen image. */
  onPickLocalFile: () => Promise<IImage | undefined>;
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
  const [numColumns, setNumColumns] = useState(3);
  const mainBoxRef = useRef<HTMLElement>(null);

  const updateColumns = useCallback((mainBoxWidth: number) => {
    // Available width after the content div's 20px padding on each side
    const available = mainBoxWidth - 40;
    // Width of the scrollable search grid for a given column count
    const colWidth = 140, gapWidth = 8, scrollbarWidth = 17;
    const w = (cols: number) =>
      cols * colWidth + Math.max(0, cols - 1) * gapWidth + scrollbarWidth;
    // Keep at least 400px for the image-details panel; reduce columns if needed
    const spacing = 20; // divider + ImageDetails margin-left
    const minDetails = 400;
    setNumColumns(
      available - w(3) - spacing >= minDetails ? 3
        : available - w(2) - spacing >= minDetails ? 2
        : 1
    );
  }, []);

  useEffect(() => {
    if (!mainBoxRef.current) return;
    const observer = new ResizeObserver((entries) => {
      updateColumns(entries[0].contentRect.width);
    });
    observer.observe(mainBoxRef.current);
    updateColumns(mainBoxRef.current.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, [updateColumns]);

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

  const sidebarHeadingStyle = css`
    margin-top: 20px;
    padding-bottom: 0;
    span {
      color: #555;
      font-size: 14px;
    }
  `;

  // The first heading has no section above it, so it uses a smaller top margin
  // that aligns its text with the source icon in the adjacent pane (which sits
  // at the pane's 20px top padding).
  const firstSidebarHeadingStyle = css`
    ${sidebarHeadingStyle}
    margin-top: 8px;
  `;

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
            border-right: 1px solid rgba(0, 0, 0, 0.12);
          `}
          onClick={(e) => {
            // Only clear if clicking directly on the div, not its children
            if (e.target === e.currentTarget) {
              setSelectedProvider(undefined);
            }
          }}
        >
            <List disablePadding>
              <ListItem css={firstSidebarHeadingStyle}>
                <ListItemText primary={l10n("ImageLibrary.ThisComputer", "This Computer")} />
              </ListItem>
              <ListItem>
                {/* a Material UI contained button with a folder icon */}
                <Button
                  variant={selectedProvider ? "outlined" : "contained"}
                  startIcon={<FolderIcon />}
                  onClick={async () => {
                    const image = await props.onPickLocalFile();
                    if (image) {
                      setSelectedImage(image);
                    }
                  }}
                >
                  {l10n("ImageLibrary.OpenFile", "Open File...")}
                </Button>
              </ListItem>

              <ListItem css={sidebarHeadingStyle}>
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
                      <ListItemIcon>
                        <img src={provider.logo} width={24} />
                      </ListItemIcon>
                    )}
                    <ListItemText primary={provider.label}></ListItemText>
                  </ListItemButton>
                ))}

              <ListItem>
                <ListItemText
                  primary={l10n("ImageLibrary.OnlineSources", "Online Sources")}
                  css={sidebarHeadingStyle}
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
                      <ListItemIcon>
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
          ref={mainBoxRef}
          css={css`
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 0;
            height: 100%;
          `}
        >
          {selectedProvider && (
            <div
              css={css`
                display: flex;
                flex-direction: column;
                height: 100%;
                padding: 20px;
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
                <ImageSearch
                  key={`${selectedProvider?.id}-${providerVersion}`}
                  provider={selectedProvider}
                  lang={props.lang ?? "en"}
                  handleSelection={setSelectedImage}
                  numColumns={numColumns}
                  initialSearchTerm={searchTerm}
                  onSearchTermChange={setSearchTerm}
                  onLanguageChange={props.onLanguageChange}
                />
                <Divider orientation="vertical" flexItem />
                {selectedImage ? (
                  <ImageDetails image={selectedImage} />
                ) : (
                  <About key={selectedProvider.id} provider={selectedProvider} />
                )}
              </div>
              <div
                css={css`
                  display: flex;
                  flex-direction: row;
                  justify-content: flex-end;
                  gap: 8px;
                  padding-top: 12px;
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
