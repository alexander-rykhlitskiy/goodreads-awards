import { fetchAndCacheHtml } from "./fetchAndCacheHtml.js";
import CachedFetcher from "./CachedFetcher.js";
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

const fetchAuthor = async (authorNodeA) => {
  const fetcher = new CachedFetcher({
    cacheSubfolder: "goodreads-booker/authors",
  });
  const code = authorNodeA.href.match(/[^\/]+$/)[0];
  const author = await fetcher.fetchData(code, authorNodeA.href, {
    extractData: (document) => {
      const bornDiv = document.querySelector(".dataTitle");
      if (!bornDiv) return {};

      const locationText = bornDiv.nextSibling.textContent.trim();
      const words = locationText.split(",");
      return { country: words[words.length - 1].trim() };
    },
  });

  return author;
};

const fetchBook = async (bookNodeA) => {
  const code = bookNodeA.href.match(/[^\/]+$/)[0];
  const href = bookNodeA.href.startsWith("https://")
    ? bookNodeA.href
    : "https://www.goodreads.com" + bookNodeA.href;
  const fetcher = new CachedFetcher({
    cacheSubfolder: "goodreads-booker/books",
  });
  const book = await fetcher.fetchData(code, href, {
    extractData: (document) => {
      const tagNodes = document.querySelectorAll(
        ".BookPageMetadataSection__genreButton"
      );
      const tags = Array.from(tagNodes).map((tag) => tag.textContent.trim());
      return { tags };
    },
  });
  return book;
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
    const author = await fetchAuthor(infoTd.querySelector(".authorName"));
    const book = await fetchBook(infoTd.querySelector(".bookTitle"));
    const info = {
      title: text(infoTd, ".bookTitle"),
      author: text(infoTd, ".authorName"),
      rating: number(minirating[0]),
      ratings: number(minirating[1]),
      award: award.replace(/\s*\(\d+\)/, ""),
      year: award.match(/\((\d+)\)/)[1],
      authorCountry: author.country,
      tags: book.tags,
    };
    console.log(Object.values(info).join("\t"));
  }
}
