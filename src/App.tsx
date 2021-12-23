import './App.css';
import { css } from '@emotion/react';
import React from 'react';

import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  Divider,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import FolderIcon from '@mui/icons-material/Folder';
import BurstModeIcon from '@mui/icons-material/BurstMode';
import CropIcon from '@mui/icons-material/Crop';
import AttributionIcon from '@mui/icons-material/Attribution';
import { ImageScreen } from './ImageScreen';
const mdTheme = createTheme();
const drawerWidth = 200;
function App() {
  return (
    <ThemeProvider theme={mdTheme}>
      <Box
        css={css`
          //height: 100%;
          display: flex;
        `}>
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
          }}>
          {/* this toolbar seems to just push us down below the app bar? what a hack. But it's from the mui sample code. */}
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText primary={'File'} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <BurstModeIcon />
                </ListItemIcon>
                <ListItemText primary={'Art of Reading'} />
              </ListItem>
              <ListItem>
                <ListItemText primary={'More Galleries...'} />
              </ListItem>
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
          `}>
          {/* this toolbar seems to just push us down below the app bar? what a hack. But it's from the mui sample code. */}
          <Toolbar />
          <ImageScreen />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
