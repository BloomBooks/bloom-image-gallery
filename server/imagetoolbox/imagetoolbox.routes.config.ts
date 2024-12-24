import { CommonRoutesConfig } from "../common/common.routes.config.js";
import express from "express";
import fs from "fs";
import path from "path";

// This class implements an API for accessing the file system looking for pictures.
// Two types are search are provided: browsing an image collection like Art of Reading
// or using a file browser to randomly find an image file.
export class ImageToolboxRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, "ImageToolboxRoutes");
  }

  // This is the base location for storing image collections.
  readonly baseFolder = "C:\\ProgramData\\SIL\\ImageCollections";
  // This Map of Maps of Maps provides lookup for relative locations of images in a collection based on keyword and language.
  // Each collection is responsible for providing an appropriate index file.
  readonly indexes = new Map<string, Map<string, Map<string, string[]>>>();

  configureRoutes() {
    this.app
      .route(`/image-toolbox/collections`)
      .get((req: express.Request, res: express.Response) => {
        fs.readdir(this.baseFolder, (err, entries) => {
          if (err) {
            res.status(200).send([]);
          } else {
            // initialize in-memory indexes?
            entries.forEach((entry) => {
              const indexPath = `${this.baseFolder}\\${entry}\\index.txt`;
              fs.readFile(indexPath, "utf8", (err, data) => {
                if (!err) {
                  this.storeIndex(entry, data);
                }
              });
            });
            const result = { collections: entries, languages: ["en", "es"] };
            res.status(200).send(result);
          }
        });
      });
    this.app
      .route("/image-toolbox/search/:collection/:lang/:term")
      .get((req: express.Request, res: express.Response) => {
        const files =
          this.indexes
            .get(req.params.collection)
            ?.get(req.params.lang)
            ?.get(req.params.term) || [];
        res.status(200).send(files);
      });
    this.app
      .route("/image-toolbox/collection-image-file/:collection/:file")
      .get((req: express.Request, res: express.Response) => {
        const filepath = `${this.baseFolder}\\${req.params.collection}\\images\\${req.params.file}`;
        this.returnImageFileContent(filepath, res);
      });
    this.app
      .route("/image-toolbox/collection-image-properties/:collection/:file")
      .get((req: express.Request, res: express.Response) => {
        const filepath = `${this.baseFolder}\\${req.params.collection}\\images\\${req.params.file}`;
        this.returnImageProperties(filepath, res);
      });
    this.app
      .route("/image-toolbox/image-file/:filepath")
      .get((req: express.Request, res: express.Response) => {
        const filepath: string = `${req.params.filepath}`;
        this.returnImageFileContent(filepath, res);
      });
    this.app
      .route("/image-toolbox/image-properties/:filepath")
      .get((req: express.Request, res: express.Response) => {
        const filepath: string = `${req.params.filepath}`;
        this.returnImageProperties(filepath, res);
      });
    return this.app;
  }

  private returnImageFileContent(
    filepath: string,
    res: express.Response<any, Record<string, any>>
  ) {
    fs.readFile(filepath, (err, data) => {
      if (err) {
        res.status(404).send(`${err}"`);
      } else {
        const extension = path.extname(filepath);
        res.status(200).type(extension).send(data);
      }
    });
  }

  private returnImageProperties(
    filepath: string,
    res: express.Response<any, Record<string, any>>
  ): void {
    try {
      const stats = fs.statSync(filepath);
      const extension = path.extname(filepath);
      let typeName: string = "";
      if (extension) {
        switch (extension.toLowerCase()) {
          case ".png":
            typeName = "PNG";
            break;
          case ".jpg":
          case ".jpeg":
            typeName = "JPEG";
            break;
          default:
            typeName = extension.substring(1).toUpperCase();
            break;
        }
      }
      res.status(200).type("json").send({ size: stats.size, type: typeName });
    } catch {
      res.status(200).type("json").send({});
    }
  }

  private storeIndex(collection: string, data: string): void {
    const lines: string[] = data.split("\n");
    const headers: string[] = lines[0].trim().split("\t");
    const indexFilename = headers.indexOf("filename", 0);
    const indexSubfolder =
      headers.indexOf("subfolder") > -1
        ? headers.indexOf("subfolder")
        : headers.indexOf("country");
    const indexEnglish = headers.indexOf("en");
    const indexSpanish = headers.indexOf("es");

    const collectionMap = new Map<string, Map<string, string[]>>();
    const basepath = `${this.baseFolder}\\${collection}\\images`;

    for (let i = 1; i < lines.length; ++i) {
      const entry = lines[i].trim().split("\t");
      const filename = entry[indexFilename];
      const subfolder = entry[indexSubfolder];
      this.storeInMapsIfFileExists(
        indexEnglish,
        indexSpanish,
        collectionMap,
        entry,
        basepath,
        subfolder,
        filename
      );
    }
    this.indexes.set(collection, collectionMap);
  }

  private storeInMapsIfFileExists(
    indexEnglish: number,
    indexSpanish: number,
    collectionMap: Map<string, Map<string, string[]>>,
    entry: string[],
    basepath: string,
    subfolder: string,
    filename: string
  ): boolean {
    const subpath = `${subfolder}\\${filename}`;
    const filepath = `${basepath}\\${subpath}`;
    try {
      fs.accessSync(filepath, fs.constants.R_OK);
      this.storeIntoCollectionMaps(
        indexEnglish,
        entry,
        indexSpanish,
        collectionMap,
        subpath.replace(/\\/g, "%2f")
      );
      return true;
    } catch (err) {
      try {
        const dirents = fs.readdirSync(`${basepath}\\${subfolder}`, {
          withFileTypes: true,
        });
        dirents.forEach((ent) => {
          if (ent.isDirectory()) {
            const subsubfolder = `${subfolder}\\${ent.name}`;
            if (
              this.storeInMapsIfFileExists(
                indexEnglish,
                indexSpanish,
                collectionMap,
                entry,
                basepath,
                subsubfolder,
                filename
              )
            )
              return true;
          }
        });
      } catch (err) {
        return false;
      }
      return false;
    }
  }

  private storeIntoCollectionMaps(
    indexEnglish: number,
    entry: string[],
    indexSpanish: number,
    collectionIndex: Map<string, Map<string, string[]>>,
    subpath: string
  ) {
    const englishTags =
      indexEnglish >= 0 && indexEnglish < entry.length
        ? entry[indexEnglish]
        : "";
    const spanishTags =
      indexSpanish >= 0 && indexSpanish < entry.length
        ? entry[indexSpanish]
        : "";
    if (englishTags) {
      const tags = englishTags.split(",");
      tags.forEach((tag) => {
        let englishMap = collectionIndex.get("en");
        if (englishMap) {
          let tagMap = englishMap.get(tag);
          // Using %2f instead of / allows the router to use :file to collect both the folder and the filename
          if (tagMap) {
            tagMap.push(subpath);
          } else {
            englishMap.set(tag, [subpath]);
          }
        } else {
          englishMap = new Map<string, string[]>();
          englishMap.set(tag, [subpath]);
          collectionIndex.set("en", englishMap);
        }
      });
    }
    if (spanishTags) {
      const tags = spanishTags.replace(/(^"|"$)/g, "").split(",");
      tags.forEach((tag) => {
        let spanishMap = collectionIndex.get("es");
        if (spanishMap) {
          let tagMap = spanishMap.get(tag);
          // Using %2f instead of / allows the router to use :file to collect both the folder and the filename
          if (tagMap) {
            tagMap.push(subpath);
          } else {
            spanishMap.set(tag, [subpath]);
          }
        } else {
          spanishMap = new Map<string, string[]>();
          spanishMap.set(tag, [subpath]);
          collectionIndex.set("es", spanishMap);
        }
      });
    }
  }
}
