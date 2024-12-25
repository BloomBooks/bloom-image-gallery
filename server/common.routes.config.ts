import express from "express";
export abstract class CommonRoutesConfig {
  app: express.Router;
  name: string;

  constructor(app: express.Router, name: string) {
    this.app = app;
    this.name = name;
    this.configureRoutes();
  }
  getName() {
    return this.name;
  }
  abstract configureRoutes(): express.Router;
}
