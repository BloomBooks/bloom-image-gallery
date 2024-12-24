import './App.css';
import { css } from '@emotion/react';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import FolderIcon from '@mui/icons-material/Folder';
import CropIcon from '@mui/icons-material/Crop';
import AttributionIcon from '@mui/icons-material/Attribution';
import { ImageScreen } from './ImageScreen';
const mdTheme = createTheme();
const drawerWidth = 200;

function App() {
  const [imageCollections, setImageCollections] = useState([] as string[]);
  const [checkedCollection, setCheckedCollection] = useState('');
  const [chosenFile, setChosenFile] = useState('');
  const [languages, setLanguages] = useState([] as string[]);

  useEffect(() => {
    axios
      .get('http://localhost:5000/image-toolbox/collections')
      .then((response) => {
        setImageCollections(response.data.collections);
        setLanguages(response.data.languages);
      })
      .catch((reason) => {
        console.log(`axios call image-toolbox/collections failed: ${reason}`);
        setImageCollections([]);
      });
  }, []);

  function handleToggleCollection(value: string) {
    return () => {
      setCheckedCollection(value);
      setChosenFile('');
    };
  }

  function handleFileClick() {
    setCheckedCollection('');
    axios
      .get('http://localhost:5000/image-toolbox/file-dialog')
      .then((response) => {
        setChosenFile((response.data as string).trim());
      })
      .catch((reason) => {
        console.log(`DEBUG axios.get image-toolbox/file-dialog failed: ${reason}`);
      });
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
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
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
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {/* this toolbar seems to just push us down below the app bar? what a hack. But it's from the mui sample code. */}
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <FolderIcon onClick={handleFileClick} />
                </ListItemIcon>
                <input
                  id="fileInput"
                  type="file"
                  css={css`
                    display: none;
                  `}
                />
                <ListItemText primary={'File'} />
              </ListItem>
              {imageCollections.map((item) => (
                <ListItem key={item}>
                  <ListItemButton
                    role={undefined}
                    onClick={handleToggleCollection(item)}
                    dense
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={item === checkedCollection}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItemButton>{' '}
                </ListItem>
              ))}
            </List>
            <Divider />
            <List>
              <ListItem>
                <ListItemIcon>
                  <AttributionIcon />
                </ListItemIcon>
                <ListItemText primary={'Give Credit'} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CropIcon />
                </ListItemIcon>
                <ListItemText primary={'Adjust'} />
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
          <ImageScreen
            collection={checkedCollection}
            lang={'en'}
            chosenFile={chosenFile}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
