import { MetadataProvider, getStandardizedLicense } from "./metadata-provider";
import { BloomMetadata } from "./bloomMediaMetadata";

export class WikiCommonsMediaProvider implements MetadataProvider {
  public canHandleDownload(url: string): boolean {
    return url.includes("wikimedia.org");
  }

  // extension will be enabled if these match
  public getHostWildcardPatterns(): string[] {
    return ["https://*.wikimedia.org/*"];
  }

  // given a URL of something to download, get metadata about that file and massage it into a standard format that Bloom can use
  public async getMetadata(
    sourcePageUrl: string,
    imageUrl: string
  ): Promise<BloomMetadata | undefined> {
    // if it's not from wikimedia, we can't handle it
    if (!imageUrl.includes("wikimedia.org")) return undefined;

    const filename = this.extractFilename(imageUrl);
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&titles=File:${encodeURIComponent(filename)}&format=json&origin=*`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      const info =
        data.query.pages[Object.keys(data.query.pages)[0]].imageinfo[0];
      console.log(JSON.stringify(info, null, 2));
      const result = getStandardizedLicense(
        info.extmetadata.LicenseShortName.value,
        info.extmetadata.LicenseUrl?.value,
        "https://commons.wikimedia.org/wiki/Commons:Licensing" // fallback if we can't figure out the license
      );
      if (!result) return undefined; // review should we really give up completely?
      const { license, licenseUrl } = result;
      return {
        url: imageUrl,
        license,
        licenseUrl,
        credits: this.stripHtmlTags(info.extmetadata.Artist.value),
        sourceWebPage: sourcePageUrl,
      };
    } catch (error) {
      console.error("Failed to fetch Commons info:", error);
    }
    return undefined;
  }

  private stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, "");
  }

  // It appears that every file on wikicommons has a unique file name?
  private extractFilename(url: string): string {
    console.log("extract " + url);
    const match = url.match(
      /commons\/(?:thumb\/)?[a-f0-9]\/[a-f0-9]{2}\/(.+?)(?:\/|$)/
    );
    console.log(match);
    return match ? decodeURIComponent(match[1]) : "";
  }
}
