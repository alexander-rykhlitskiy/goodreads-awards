import fs from "fs";
import path from "path";

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


export { fetchAndCacheHtml };
