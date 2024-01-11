import { fetchAndCacheHtml } from "./fetchAndCacheHtml.js";
import jsdom from "jsdom";

const { JSDOM } = jsdom;

// const wikiUrl = `https://en.wikipedia.org/wiki/List_of_winners_and_nominated_authors_of_the_Booker_Prize`;
// const wikiDom = new JSDOM(
//   await fetchAndCacheHtml(word, url, { cacheSubfolder: "goodreads-booker" })
// );
// const document = wikiDom.window.document;

// const winnerTrs = [];
// for (const tr of document.querySelectorAll("tr")) {
//   if (tr.querySelector("td").textContent.includes("Winner")) {
//     winnerTrs.push(tr);
//   }
// }
// wikiDocument.querySelector(
//   '[style="background:#FAEB86; white-space:nowrap; color:black"]'
// );

const text = (node, selector) =>
  node.querySelector(selector).textContent.trim().replace(/\s+/g, " ");
const number = (string) => Number(string.replace(",", "").match(/^[\d\.]+/));

const country = async (authorNodeA) => {
  const authorDom = new JSDOM(
    await fetchAndCacheHtml(
      authorNodeA.href.match(/[^\/]+$/),
      authorNodeA.href,
      {
        cacheSubfolder: "goodreads-booker/authors",
      }
    )
  );
  const bornDiv = authorDom.window.document.querySelector(".dataTitle");
  if (!bornDiv) return null;

  const locationText = bornDiv.nextSibling.textContent.trim();
  const words = locationText.split(",");
  return words[words.length - 1].trim();
};

const tags = async (bookNodeA) => {
  const href = bookNodeA.href.startsWith("https://")
    ? bookNodeA.href
    : "https://www.goodreads.com" + bookNodeA.href;
  const bookDom = new JSDOM(
    await fetchAndCacheHtml(bookNodeA.href.match(/[^\/]+$/), href, {
      cacheSubfolder: "goodreads-booker/books",
    })
  );
  const tags = bookDom.window.document.querySelectorAll(
    ".BookPageMetadataSection__genreButton"
  );
  return Array.from(tags)
    .map((tag) => tag.textContent.trim())
    .join(", ");
};

for (let i = 0; i <= 19; i++) {
  const url = `https://www.goodreads.com/award/show/13-booker-prize?page=${i}`;
  const dom = new JSDOM(
    await fetchAndCacheHtml(i, url, { cacheSubfolder: "goodreads-booker" })
  );
  const document = dom.window.document;
  for (const tr of document.querySelectorAll("tr[itemscope]")) {
    const infoTd = tr.querySelector("td:nth-child(2)");
    const minirating = text(infoTd, ".minirating").split(" — ");
    const award =
      infoTd.children[infoTd.children.length - 1].textContent.trim();

    const info = {
      title: text(infoTd, ".bookTitle"),
      author: text(infoTd, ".authorName"),
      rating: number(minirating[0]),
      ratings: number(minirating[1]),
      award: award.replace(/\s*\(\d+\)/, ""),
      year: award.match(/\((\d+)\)/)[1],
      authorCountry: await country(infoTd.querySelector(".authorName")),
      tags: await tags(infoTd.querySelector(".bookTitle")),
    };
    console.log(Object.values(info).join("\t"));
  }
}
