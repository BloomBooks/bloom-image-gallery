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
import { ImageCollectionProvider } from "./ImageProvider";
import { PixabayImageProvider } from "./PixabayProvider";

const mdTheme = createTheme();
const drawerWidth = 200;

interface IImageSource {
  label: string;
  id: string;
}
function App() {
  const [imageCollections, setImageCollections] = useState<IImageSource[]>([
    {
      label: "Pixabay",
      id: "pixabay",
    },
  ]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | undefined
  >(undefined);

  const [languages, setLanguages] = useState([] as string[]);
  const [selectedImageUrl, setSelectedImage] = React.useState("");
  const [imageProvider, setImageProvider] = useState<
    ImageCollectionProvider | undefined
  >(undefined);

  function handleSearchSelection(item: string) {
    setSelectedImage(item);
  }

  useEffect(() => {
    // choose the first collection
    if (imageCollections.length > 0) {
      setSelectedCollectionId(imageCollections[0].id);
    }
  }, [imageCollections]);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/image-toolbox/collections`)
      .then((response) => {
        // at the moment all we're getting is a single name
        const collections: Array<IImageSource> = response.data.collections.map(
          (c: any) => {
            return { label: c, id: c };
          }
        );
        // push these onto the the imageCollections state, prevent duplicates (chat claims react dev mode does it on purpose?)
        setImageCollections((prev) => {
          const newCollections = collections.filter(
            (c) => !prev.find((p) => p.id === c.id)
          );
          return [...prev, ...newCollections];
        });

        setLanguages(response.data.languages);
        // Select the first collection if available (just for convenience while coding)
        // if (response.data.collections.length > 0) {
        //   setSelectedCollectionId(collections[0].id);
        // }
      })
      .catch((reason) => {
        console.log(`axios call image-toolbox/collections failed: ${reason}`);
        //setImageCollections([]);
      });
  }, []);

  useEffect(() => {
    setSelectedImage("");
  }, [selectedCollectionId]);

  useEffect(() => {
    if (selectedCollectionId) {
      const selectedCollection = imageCollections.find(
        (c) => c.id === selectedCollectionId
      );
      if (!selectedCollection) {
        throw new Error(`Collection ${selectedCollectionId} not found`);
      }

      if (selectedCollectionId === "pixabay") {
        setImageProvider(new PixabayImageProvider());
      } else {
        setImageProvider(
          new ImageCollectionProvider(
            selectedCollection.id,
            selectedCollection.label
          )
        );
      }
    } else {
      setImageProvider(undefined);
    }
  }, [selectedCollectionId]);

  function handleSelectCollection(id: string) {
    return () => {
      setSelectedCollectionId(id);
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
                      setSelectedImage(url);
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
              {imageCollections?.map((collection) => (
                <ListItemButton
                  key={collection.id}
                  onClick={handleSelectCollection(collection.id)}
                  selected={collection.id === selectedCollectionId}
                  dense
                >
                  <ListItemText primary={collection.label}></ListItemText>
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
          {selectedCollectionId && imageProvider && (
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
                collectionId={selectedCollectionId}
                url={selectedImageUrl}
              />
            </div>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
