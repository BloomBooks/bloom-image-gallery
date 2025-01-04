import { CommonRoutesConfig } from "./common.routes.config.js";
import express from "express";
import { BloomMediaMetadata } from "../common/bloomMediaMetadata.js"; // actually the type here in the server doesn't matter?

const recordedDownloads: BloomMediaMetadata[] = [];

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
          console.log("/takeDownloads before", recordedDownloads);
          recordedDownloads.unshift(...req.body.reverse());
          console.log("/takeDownloads now", recordedDownloads);
          res.status(200).json({ message: "Downloads queued successfully" });
        } else {
          res.status(400).json({ error: "Request body must be an array" });
        }
      });
    this.app
      .route(`/getDownloads`)
      .get((req: express.Request, res: express.Response) => {
        console.log("/getDownloads", recordedDownloads);
        res.status(200).json(recordedDownloads);
      });
    return this.app;
  }
}
