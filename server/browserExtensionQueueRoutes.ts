import { CommonRoutesConfig } from "./common.routes.config.js";
import express from "express";
import { BloomMediaMetadata } from "../src/bloomMediaMetadata.js"; // actually the type here in the server doesn't matter?

const queuedDownloads: BloomMediaMetadata[] = [];

export class BrowserExtensionQueueRoutes extends CommonRoutesConfig {
  constructor(app: express.Router) {
    super(app, "BrowserExtensionQueueRoutes");
  }

  configureRoutes() {
    this.app
      .route(`/takeDownloads`)
      .post((req: express.Request, res: express.Response) => {
        console.log("Received downloads", req.body);
        if (Array.isArray(req.body)) {
          // Reverse the array and add to the front of queuedDownloads
          console.log("/takeDownloads before", queuedDownloads);
          queuedDownloads.unshift(...req.body.reverse());
          console.log("/takeDownloads now", queuedDownloads);
          res.status(200).json({ message: "Downloads queued successfully" });
        } else {
          res.status(400).json({ error: "Request body must be an array" });
        }
      });
    this.app
      .route(`/getDownloads`)
      .get((req: express.Request, res: express.Response) => {
        console.log("/getDownloads", queuedDownloads);
        res.status(200).json(queuedDownloads);
      });
    return this.app;
  }
}
