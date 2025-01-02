/// <reference types="@types/wicg-file-system-access" />
import { css } from "@emotion/react";
import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  ListItemButton,
  Button,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import FolderIcon from "@mui/icons-material/Folder";
import { ImageDetails } from "./ImageDetails";
import { ImageSearch } from "./ImageSearch";
import { Pixabay } from "./search-providers/PixabayProvider";
import { OpenVerse } from "./search-providers/OpenVerseProvider";
import { Europeana } from "./search-providers/EuropeanaProvider";
import { WikipediaProvider } from "./search-providers/WikipediaProvider";
import { BrowserExtensionQueueProvider } from "./search-providers/BrowserExtensionQueueProvider";
import { ISearchProvider, IImage } from "./search-providers/imageProvider";
import { ArtOfReadingProvider } from "./search-providers/ArtOfReadingProvider";

const mdTheme = createTheme();
const drawerWidth = 200;

function App() {
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
      const pixabay = new Pixabay();
      pixabay.onReadyStateChange = forceUpdate;
      addToImageProviders(new OpenVerse());
      addToImageProviders(new WikipediaProvider());
      addToImageProviders(await new ArtOfReadingProvider().checkReadiness());
      addToImageProviders(new BrowserExtensionQueueProvider());
      addToImageProviders(pixabay);
      addToImageProviders(await new Europeana().checkReadiness());
    };
    initProviders();
  }, []); // Only run once on mount

  const [selectedProvider, setSelectedProvider] = useState<
    ISearchProvider | undefined
  >(undefined);

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

  return (
    <ThemeProvider theme={mdTheme}>
      <Box
        css={css`
          height: 100vh;
          display: flex;
        `}
      >
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
              height: "100%",
            },
          }}
        >
          <Box
            sx={{
              overflow: "auto",
              height: "100%",
            }}
            onClick={(e) => {
              // Only clear if clicking directly on the Box, not its children
              if (e.target === e.currentTarget) {
                setSelectedProvider(undefined);
              }
            }}
          >
            <List>
              <ListItem>
                {/* a Material UI contained button with a folder icon */}
                <Button
                  variant={selectedProvider ? "outlined" : "contained"}
                  startIcon={<FolderIcon />}
                  onClick={async () => {
                    try {
                      const [fileHandle] = await window.showOpenFilePicker({
                        types: [
                          {
                            description: "Images",
                            accept: {
                              "image/jpeg": [".jpeg", ".jpg"],
                              "image/png": [".png"],
                              //todo 'image/tiff': ['.tiff'],
                              "image/bmp": [".bmp"],
                            },
                          },
                        ],
                      });
                      const file = await fileHandle.getFile();
                      const url = URL.createObjectURL(file);
                      setSelectedImage({
                        thumbnailUrl: url,
                        size: file.size,
                        type: file.type,
                      });
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                >
                  Open File...
                </Button>
              </ListItem>

              <ListItem>
                <ListItemText
                  primary="Online Sources"
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

              <ListItem css={sidebarHeadingStyle}>
                <ListItemText primary="Collections on this Computer" />
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
            </List>
          </Box>
        </Drawer>
        <Box
          component="main"
          css={css`
            //            height: 100%;
            display: flex;
            flex-direction: column;
            width: 100%;
          `}
        >
          {selectedProvider && (
            <div
              css={css`
                display: flex;
                flex-direction: row;
                width: 100%;
                height: calc(100vh - 84px);
                padding: 20px;
              `}
            >
              <ImageSearch
                key={`${selectedProvider?.id}-${providerVersion}`}
                provider={selectedProvider}
                lang={"en"}
                handleSelection={setSelectedImage}
              />
              <Divider orientation="vertical" flexItem />
              <ImageDetails image={selectedImage} />
            </div>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
