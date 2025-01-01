![Static Badge](https://img.shields.io/badge/status-WIP-blue)

An experimental react component that allows searching from multiple sites as well as local collections like Art of Reading.

# Developing

1. Requires [Volta](https://github.com/volta-cli/volta)
2. `yarn dev`
3. In Chrome, go to chrome://extensions
4. Enable "Developer mode"
5. Click "Load unpacked", choose the `dist/` folder produced by `yarn dev`
6. In the extension card named "Download to Bloom", click "Inspect views <u>service worker</u>". This will open a DevTools window for the extension.
7. As you make changes, the extension will automatically update.
