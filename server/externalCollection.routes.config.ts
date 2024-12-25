import { CommonRoutesConfig } from "./common.routes.config.js";
import express from "express";

export class ExternalApiKeyRoutes extends CommonRoutesConfig {
  constructor(app: express.Router) {
    super(app, "ExternalApiKeyRoutes");
  }

  configureRoutes() {
    this.app
      .route("/api-key/:service")
      .get((req: express.Request, res: express.Response) => {
        const service = req.params.service;
        console.log(`API key requested for: ${service}`);
        const envKey = `ImageToolbox_${service}`;
        const apiKey = process.env[envKey] || "";
        if (!apiKey) {
          console.error(`API key not found for: ${service}`);
        }
        res.status(200).send({ key: apiKey });
      });
    return this.app;
  }
}
