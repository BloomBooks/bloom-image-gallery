![Static Badge](https://img.shields.io/badge/status-WIP-blue)

An experimental react component for Bloom that supports finding images and metadata needed for legal reuse via:

- file system
- online image sites
- local collections like Art of Reading

![image](https://github.com/user-attachments/assets/28371b91-a275-4f62-9e56-0d3d139f5d18)

This repository includes a little server process for use during development, but the component is indetended to be used with Bloom Editor as its backend eventually. The server does very little except for local collections.

# Developing

1. Requires [Volta](https://github.com/volta-cli/volta)
2. `yarn install` will load dependencies.
3. `yarn dev` will run both the server and open a browser tab with the client. Everything will update automatically as you change files.

## Unit Tests

`yarn test`
