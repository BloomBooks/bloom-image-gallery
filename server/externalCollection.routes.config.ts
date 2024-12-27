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
        const apiKey =
          process.env[`ImageToolbox_${service}`] || // in case you want one specific to this app
          process.env[`${service}`] ||
          "";
        if (!apiKey) {
          console.error(`API key not found for: ${service}`);
          return res
            .status(404)
            .send({ error: `API key not found for service: ${service}` });
        }
        res.status(200).send({ key: apiKey });
      });
    return this.app;
  }
}
