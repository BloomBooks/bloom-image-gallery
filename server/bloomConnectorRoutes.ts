import { CommonRoutesConfig } from "./common.routes.config.js";
import express from "express";

// Define the queued downloads array
let queuedDownloads: any[] = [];

export class BloomConnectorRoutes extends CommonRoutesConfig {
  constructor(app: express.Router) {
    super(app, "BloomConnectorRoutes");
  }

  configureRoutes() {
    this.app
      .route(`/takeDownloads`)
      .post((req: express.Request, res: express.Response) => {
        console.log("Received downloads", req.body);
        if (Array.isArray(req.body)) {
          queuedDownloads = req.body;
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
