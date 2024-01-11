import fs from "fs";
import path from "path";

import jsdom from "jsdom";
const { JSDOM } = jsdom;

const cacheFolder = "cache";

const fetchAndCacheHtml = async (
  code,
  url,
  { cacheSubfolder, logging } = { logging: true }
) => {
  const fileName = `${code}.html`;
  const folder = path.join(cacheFolder, cacheSubfolder || "");

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  const cacheFilePath = path.join(folder, fileName);

  if (fs.existsSync(cacheFilePath)) {
    if (logging) console.log("Reading from cache: ", cacheFilePath);
    return fs.readFileSync(cacheFilePath, "utf8");
  }
  if (logging) console.log(`Fetching to ${folder}: `, code);

  const html = await (await fetch(url)).text();
  fs.writeFileSync(cacheFilePath, html);

  return html;
};

// const fetchAndCacheJSONData = async (
//   code,
//   url,
//   { extractData, cacheSubfolder, logging } = { logging: true }
// ) => {
//   const fileName = `${code}.json`;
//   const folder = path.join(cacheFolder, cacheSubfolder || "");

//   const html = await fetchAndCacheHtml(code, url, {
//     cacheSubfolder,
//     logging,
//   });
//   const dom = new JSDOM(html)
//   const jsonData = extractData(dom.window.document);
//   const cacheFilePath = path.join(folder, fileName);

// }

// class CachedFetcher {
//   constructor(cacheSubfolder, logging = true) {
//     this.cacheSubfolder = cacheSubfolder;
//     this.logging = logging;
//   }
//   async fetch(code, url, { logging } = { logging: true }) {
//     return fetchAndCacheHtml(code, url, {
//       cacheSubfolder: this.cacheSubfolder,
//       logging,
//     });
//   }
// }

export { fetchAndCacheHtml };
