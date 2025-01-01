import express from "express";
import * as http from "http";
import cors from "cors";

import { CommonRoutesConfig } from "./common.routes.config.js";
import { LocalCollectionRoutes } from "./localCollection.routes.config.js";
import { ExternalApiKeyRoutes } from "./externalCollection.routes.config.js";
import { BrowserExtensionQueueRoutes } from "./browserExtensionQueueRoutes.js";

const app: express.Application = express();
const server: http.Server = http.createServer(app);
const port = 5000;
const routes: Array<CommonRoutesConfig> = [];

// here we are adding middleware to parse all incoming requests as JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// here we are adding middleware to allow cross-origin requests
app.use(cors());

// Create a new router for all our routes
const router = express.Router();

// Add routes to the router instead of directly to app
routes.push(new LocalCollectionRoutes(router));
routes.push(new ExternalApiKeyRoutes(router));
routes.push(new BrowserExtensionQueueRoutes(router));

// Mount the router under the prefix
app.use(router);

// Add 404 handling for unknown routes
app.use((req: express.Request, res: express.Response) => {
  console.error(`Cannot ${req.method} ${req.url}`);
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// this is a simple route to make sure everything is working properly
const runningMessage = `Server running at http://localhost:${port}`;
router.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).send(runningMessage);
});

server.listen(port, () => {
  // we always want to know when the server is done starting up
  console.log(runningMessage);
  routes.forEach((route: CommonRoutesConfig) => {
    console.log(`Routes configured for ${route.getName()}`);
  });
});
