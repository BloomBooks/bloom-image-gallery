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
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import FolderIcon from "@mui/icons-material/Folder";
import AttributionIcon from "@mui/icons-material/Attribution";
import { ImageDetails } from "./ImageDetails";
import { ImageSearch } from "./ImageSearch";
import { useLocalCollections } from "./providers/LocalCollectionProvider";
import { Pixabay } from "./providers/PixabayProvider";
import { OpenVerse } from "./providers/OpenVerseProvider";
import { Europeana } from "./providers/EuropeanaProvider";
import { IImageCollectionProvider, IImage } from "./providers/imageProvider";

const mdTheme = createTheme();
const drawerWidth = 200;

function App() {
  const [imageProviders, setImageProviders] = useState<
    IImageCollectionProvider[]
  >([]);

  const addToImageProviders = (provider: IImageCollectionProvider) => {
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
      addToImageProviders(new OpenVerse());
      addToImageProviders(await new Pixabay().checkReadiness());
      addToImageProviders(await new Europeana().checkReadiness());
    };
    initProviders();
  }, []); // Only run once on mount

  // Handle local collections separately
  useLocalCollections(addToImageProviders);

  const [selectedProvider, setSelectedProvider] = useState<
    IImageCollectionProvider | undefined
  >(undefined);

  const [selectedImage, setSelectedImage] = React.useState<IImage | undefined>(
    undefined
  );

  useEffect(() => {
    // select an initial collection
    if (!selectedProvider && imageProviders.length > 0) {
      setSelectedProvider(imageProviders[0]);
    }
  }, [imageProviders]);

  function handleSelectCollection(provider: IImageCollectionProvider) {
    setSelectedProvider(provider);
  }

  return (
    <ThemeProvider theme={mdTheme}>
      <Box
        css={css`
          //height: 100%;
          display: flex;
        `}
      >
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              Find Image
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          {/* this toolbar seems to just push us down below the app bar? what a hack. But it's from the mui sample code. */}
          <Toolbar />
          <Box sx={{ overflow: "auto" }}>
            <List>
              <ListItem disablePadding>
                <ListItemButton
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
                  <ListItemIcon>
                    <FolderIcon />
                  </ListItemIcon>
                  <ListItemText primary={"Open File..."} />
                </ListItemButton>
              </ListItem>
              {imageProviders?.map((provider) => (
                <ListItemButton
                  key={provider.id}
                  onClick={() => handleSelectCollection(provider)}
                  selected={provider === selectedProvider}
                  dense
                  sx={{
                    position: "relative",
                    "&::after": provider.needsApiUrl
                      ? {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: "rgba(255, 255, 255, 0.5)",
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
          {/* this toolbar seems to just push us down below the app bar? what a hack. But it's from the mui sample code. */}
          <Toolbar />
          {selectedProvider?.needsApiUrl && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                margin: "20px",
              }}
            >
              <Typography variant="caption">
                {`(This is a message for developers. For users, we'll either need a UI for pasting in or we'll provide the keys via our server.)`}
                <br />
                <br />
                {`Before you can use ${selectedProvider.label}, you will need to obtain a free API key from them for at `}
                {/* eslint-disable-next-line react/jsx-no-target-blank */}
                <a href={selectedProvider.needsApiUrl} target="_blank">
                  {selectedProvider.needsApiUrl}
                </a>
                <br />
                <br />
                {`Once you have the key, put it in an environment variable named ${selectedProvider.label}. Remember to restart the app or dev environment after setting the key.`}
              </Typography>
            </Box>
          )}
          {selectedProvider && !selectedProvider.needsApiUrl && (
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
