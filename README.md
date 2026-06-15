![Static Badge](https://img.shields.io/badge/status-WIP-blue)

An experimental react component for Bloom that supports finding images and metadata needed for legal reuse via:

- file system
- online image sites
- local collections like Art of Reading

![image](https://github.com/user-attachments/assets/28371b91-a275-4f62-9e56-0d3d139f5d18)

This repository includes a little server process for use during development, but the component is indetended to be used with Bloom Editor as its backend eventually. The server does very little except for local collections.

# Developing

1. Requires [Vite+](https://viteplus.dev) (the `vp` CLI). It manages the Node.js version (pinned in `devEngines` in `package.json`) and pnpm for you.
2. `vp install` will load dependencies.
3. `vp dev` (or the equivalent `pnpm dev`) will run both the little dev server and open a browser tab with the client. Everything will update automatically as you change files. (The dev server is started automatically by a Vite plugin; if you'd rather run it on its own, use `pnpm run server`.)

## Unit Tests

`vp test`
