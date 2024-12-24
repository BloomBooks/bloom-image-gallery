import express from 'express';
import * as http from 'http';
import cors from 'cors';

import { CommonRoutesConfig } from './common/common.routes.config.js';
import { ImageToolboxRoutes } from './imagetoolbox/imagetoolbox.routes.config.js';

const app: express.Application = express();
const server: http.Server = http.createServer(app);
const port = 5000;
const routes: Array<CommonRoutesConfig> = [];

// here we are adding middleware to parse all incoming requests as JSON
app.use(express.json());

// here we are adding middleware to allow cross-origin requests
app.use(cors());

// here we are adding the ImageRoutes to our array,
// after sending the Express.js application object to have the routes added to our app!
routes.push(new ImageToolboxRoutes(app));

// this is a simple route to make sure everything is working properly
const runningMessage = `Server running at http://localhost:${port}`;
app.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).send(runningMessage);
});

server.listen(port, () => {
  // we always want to know when the server is done starting up
  console.log(runningMessage);
  routes.forEach((route: CommonRoutesConfig) => {
    console.log(`Routes configured for ${route.getName()}`);
  });
});
