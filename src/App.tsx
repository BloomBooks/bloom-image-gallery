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
  Checkbox,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import FolderIcon from "@mui/icons-material/Folder";
import AttributionIcon from "@mui/icons-material/Attribution";
import { ImageDetails } from "./ImageDetails";
import { ImageSearch } from "./ImageSearch";
import { CollectionImageProvider } from "./ImageProvider";

const mdTheme = createTheme();
const drawerWidth = 200;

function App() {
  const [imageCollections, setImageCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<
    string | undefined
  >(undefined);
  const [chosenFileUrl, setChosenFileUrl] = useState<string | undefined>(
    undefined
  );
  const [languages, setLanguages] = useState([] as string[]);
  const [selectedImage, setSelectedImage] = React.useState("");
  const [imageProvider, setImageProvider] = useState<
    CollectionImageProvider | undefined
  >(undefined);

  function handleSearchSelection(item: string) {
    setSelectedImage(item);
  }

  useEffect(() => {
    axios
      .get(`http://localhost:5000/image-toolbox/collections`)
      .then((response) => {
        setImageCollections(response.data.collections);
        setLanguages(response.data.languages);
      })
      .catch((reason) => {
        console.log(`axios call image-toolbox/collections failed: ${reason}`);
        setImageCollections([]);
      });
  }, []);

  useEffect(() => {
    setSelectedImage("");
  }, [selectedCollection]);

  useEffect(() => {
    if (selectedCollection) {
      setImageProvider(new CollectionImageProvider(selectedCollection));
    } else {
      setImageProvider(undefined);
    }
  }, [selectedCollection]);

  function handleSelectCollection(value: string) {
    return () => {
      setSelectedCollection(selectedCollection === value ? undefined : value);
      setChosenFileUrl(undefined);
    };
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
              Image Toolbox
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
                      setChosenFileUrl(url);
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
              {imageCollections?.map((item) => (
                <ListItemButton
                  key={item}
                  onClick={handleSelectCollection(item)}
                  selected={item === selectedCollection}
                  dense
                >
                  <ListItemText primary={item} />
                </ListItemButton>
              ))}
            </List>
            <Divider />
            <List>
              <ListItem>
                <ListItemIcon>
                  <AttributionIcon />
                </ListItemIcon>
                <ListItemText primary={"Give Credit"} />
              </ListItem>
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
          {selectedCollection && imageProvider && (
            <div
              css={css`
                display: flex;
                flex-direction: row;
                width: 100%;
                height: 500px;
                padding: 20px;
              `}
            >
              <ImageSearch
                provider={imageProvider}
                lang={"en"}
                handleSelection={handleSearchSelection}
              />
              <Divider orientation="vertical" flexItem />
              <ImageDetails
                collection={selectedCollection}
                imageFile={selectedImage}
                chosenFileUrl={chosenFileUrl}
              />
            </div>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
