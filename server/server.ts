import express from "express";
import * as http from "http";
import cors from "cors";

import { CommonRoutesConfig } from "./common.routes.config.js";
import { LocalCollectionRoutes } from "./localCollection.routes.config.js";
import { ExternalApiKeyRoutes } from "./externalCollection.routes.config.js";

const app: express.Application = express();
const server: http.Server = http.createServer(app);
const port = 5000;
const routes: Array<CommonRoutesConfig> = [];

// Define the base path prefix
const basePathPrefix = "/image-toolbox";

// here we are adding middleware to parse all incoming requests as JSON
app.use(express.json());

// here we are adding middleware to allow cross-origin requests
app.use(cors());

// Create a new router for all our routes
const router = express.Router();

// Add routes to the router instead of directly to app
routes.push(new LocalCollectionRoutes(router));
routes.push(new ExternalApiKeyRoutes(router));

// Mount the router under the prefix
app.use(basePathPrefix, router);

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
