import { fetchAndCacheHtml } from "./fetchAndCacheHtml.js";
import CachedFetcher from "./CachedFetcher.js";
import jsdom from "jsdom";

const { JSDOM } = jsdom;

const baseUrl = process.argv[2];

const toText = (node, selector) =>
  node.querySelector(selector).textContent.trim().replace(/\s+/g, " ");
const toNumber = (string) => Number(string.replace(",", "").match(/^[\d\.]+/));
const pageCode = (href) => href.match(/[^\/]+$/)[0];

const fetchAuthor = async (authorNodeA) => {
  const fetcher = new CachedFetcher({
    cacheSubfolder: "goodreads/authors",
  });
  const code = pageCode(authorNodeA.href);
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
  const code = pageCode(bookNodeA.href);
  const href = bookNodeA.href.startsWith("https://")
    ? bookNodeA.href
    : "https://www.goodreads.com" + bookNodeA.href;
  const fetcher = new CachedFetcher({
    cacheSubfolder: "goodreads/books",
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

const numberOfPages = (document) => {
  const lastPaginationLink = document.querySelector(".next_page");
  return parseInt(lastPaginationLink.previousElementSibling.textContent);
};

const processPage = async (baseUrl, pageNumber) => {
  const url = baseUrl + `?page=${pageNumber}`;
  const dom = new JSDOM(
    await fetchAndCacheHtml(pageNumber, url, {
      cacheSubfolder: "goodreads/" + pageCode(baseUrl),
    })
  );
  const document = dom.window.document;
  for (const tr of document.querySelectorAll("tr[itemscope]")) {
    const infoTd = tr.querySelector("td:nth-child(2)");
    const minirating = toText(infoTd, ".minirating").split(" — ");
    const award =
      infoTd.children[infoTd.children.length - 1].textContent.trim();
    const author = await fetchAuthor(infoTd.querySelector(".authorName"));
    const book = await fetchBook(infoTd.querySelector(".bookTitle"));
    const info = {
      title: toText(infoTd, ".bookTitle"),
      author: toText(infoTd, ".authorName"),
      rating: toNumber(minirating[0]),
      ratings: toNumber(minirating[1]),
      award: award.replace(/\s*\(\d+\)/, ""),
      year: award.match(/\((\d+)\)/)?.[1],
      authorCountry: author.country,
      tags: book.tags,
    };
    console.log(Object.values(info).join("\t"));
  }

  return document;
};

const document = await processPage(baseUrl, 1);

for (let i = 2; i <= numberOfPages(document); i++) {
  processPage(baseUrl, i);
}
