import { CommonRoutesConfig } from "./common.routes.config.js";
import express from "express";
import { DownloadRecord } from "../common/bloomMediaMetadata.js";
import fs from "fs";
import path from "path";
import os from "os";

const downloadsPath = path.join(
  os.tmpdir(),
  "bloom-image-gallery-browser-downloads.json"
);

function loadDownloadRecords(): DownloadRecord[] {
  try {
    if (fs.existsSync(downloadsPath)) {
      const data = fs.readFileSync(downloadsPath, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading downloads:", error);
  }
  return [];
}

function saveDownloads(downloads: DownloadRecord[]) {
  try {
    fs.writeFileSync(downloadsPath, JSON.stringify(downloads, null, 2));
  } catch (error) {
    console.error("Error saving downloads:", error);
  }
}

const recordedDownloadRecords: DownloadRecord[] = loadDownloadRecords();

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
          const newDownloads = processDownloadRecords(req.body);
          // Reverse the array and add to the front of queuedDownloads
          console.log("/takeDownloads before", recordedDownloadRecords);
          recordedDownloadRecords.unshift(...newDownloads.reverse());
          saveDownloads(recordedDownloadRecords);
          console.log("/takeDownloads now", recordedDownloadRecords);
          res.status(200).json({ message: "Downloads queued successfully" });
        } else {
          res.status(400).json({ error: "Request body must be an array" });
        }
      });
    this.app
      .route(`/getDownloads`)
      .get((req: express.Request, res: express.Response) => {
        console.log("/getDownloads", recordedDownloadRecords);
        res.status(200).json(recordedDownloadRecords);
      });

    return this.app;
  }
}
function processDownloadRecords(downloads: DownloadRecord[]): DownloadRecord[] {
  const localDownloadsPath = path.join(
    process.env.USERPROFILE || os.homedir(),
    "Downloads"
  );

  return downloads.map((download) => {
    const r: DownloadRecord = {
      ...download,
      computedLocalSavedPath: path.join(
        localDownloadsPath,
        path.basename(download.filename)
      ),
    };
    return r;
  });
}
