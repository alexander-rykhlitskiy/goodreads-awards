import fs from "fs";
import path from "path";

import jsdom from "jsdom";
const { JSDOM } = jsdom;

class CachedFetcher {
  constructor({ cacheSubfolder, logging } = { logging: true }) {
    this.cacheSubfolder = cacheSubfolder;
    this.logging = logging;
    this.cacheFolder = "cache";
    this.folder = path.join(this.cacheFolder, this.cacheSubfolder || "");
  }

  async fetchHtml(code, url) {
    const filePath = this.cacheFilePath(`${code}.html`);

    if (!fs.existsSync(this.folder)) {
      fs.mkdirSync(this.folder, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      if (this.logging) console.log("Reading from cache: ", filePath);
      return fs.readFileSync(filePath, "utf8");
    }
    if (this.logging) console.log(`Fetching to ${filePath}`);

    const html = await (await fetch(url)).text();
    fs.writeFileSync(filePath, html);

    return html;
  }

  async fetchData(code, url, { extractData }) {
    const filePath = this.cacheFilePath(`${code}.json`);

    if (fs.existsSync(filePath)) {
      if (this.logging) console.log("Reading from cache: ", filePath);
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    if (this.logging) console.log(`Fetching to ${filePath}`);

    const html = await this.fetchHtml(code, url);
    const dom = new JSDOM(html);
    const jsonData = extractData(dom.window.document);
    fs.writeFileSync(filePath, JSON.stringify(jsonData));
    return jsonData;
  }

  cacheFilePath(fileName) {
    return path.join(this.folder, fileName);
  }
}

export default CachedFetcher;
