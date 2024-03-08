import { ZenRows } from "zenrows";
import puppeteer from "puppeteer";
import { parse } from "node-html-parser";
import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const zenrowsKey = process.env.ZENROWS_KEY || 'fd002cb32a7f39db861135a38afe3b52a87d6a4a'

app.get("/", async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send("Hello Tao! By Won Rhee");
});

app.get("/homes", async (req, res) => {
  const searchParam: SearchParam = { state: req.query.state as string, city: req.query.city as string }
  const result = await scrape(searchParam)
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(result));
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

interface SearchParam {
  state: string;
  city: string;
}

const scrape = async ({ state, city }: SearchParam) => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: true,
    // userDataDir: "./user_data",
  });
  const page = await browser.newPage();

  // Set screen size
  const width = 1280
  const height = 720
  await page.setViewport({ width: width, height: height });

  // Navigate the page to a URL
  await page.goto("https://google.com/search?q=top+home+listing+websites");

  // Ensure search is done
  // TODO: Test reliablity, improve as needed
  const resultStatsSelector = "#result-stats";
  await page.waitForSelector(resultStatsSelector);

  // Grab organic results
  const resultsSelector = 'div[class^="g "] div:first-child div:first-child div a';
  const gResults = await page.$$eval(resultsSelector, (els) => els.map((el) => {
    return {
      title: el.innerText,
      href: el.getAttribute("href"),
    };
  }));

  // Find trulia.com from google result
  const truliaUrl = "trulia.com";
  let truliaSite = "";
  for (let i = 0; i < gResults.length; i++) {
    if (gResults[i].href.includes(truliaUrl)) {
      truliaSite = gResults[i].href;
      break;
    }
  }

  // Go to trulia.com
  let searchSite = !truliaSite ? `https://${truliaUrl}` : truliaSite;
  searchSite = searchSite.replace(/\/+$/, "") // Remove trailing slashes
  // await page.goto(searchSite, { waitUntil: "domcontentloaded" });

  // Close out browser since rest of code will be using 3rd party service
  await browser.close();

  const results = [];

  // Paginate to few pages
  let pageNum = 1;
  while (pageNum <= 3) {
    const pResult = await trulia({ state, city }, pageNum);
    results.push(...pResult)
    pageNum++;
  }

  return {
    "source": "trulia.com",
    "results": results
  };


  // TODO: Add home listing from Zillow(?)
  // const zillow = async () => {
  //   const site = "https://www.zillow.com/";
  //   await page.goto(site);
  //   const input = '[data-testid="search-bar-container"] input';
  //   await page.waitForSelector(input);
  //   await page.focus(input);
  //   await page.type(input, "Houston, TX", { delay: 100 });
  //   await page.keyboard.press("Enter");
  //   const search = "https://www.zillow.com/homes/new-york,-ny_rb/";
  //   const response = await fetch(search);
  //   const html = await response.text();
  //   console.log(html);
  // };
};


// trulia specific
const trulia = async (searchParam: SearchParam, pageNum?: number) => {
  // const params = searchTerm.split(",")
  //   .reverse()
  //   .map((s: string) => s.trim().replace(/[\s]+/g, '_'))
  //   .join("/")
  // let searchUrl = `https://trulia.com/${params}`

  const baseUrl = 'https://trulia.com'
  let searchUrl = `${baseUrl}/${searchParam.state.trim()}/${searchParam.city.trim()}`
  searchUrl += pageNum > 1 ? `/${pageNum}_p` : '';

  // Use external proxy to avoid captcha and other security mechanisms
  const client = new ZenRows("fd002cb32a7f39db861135a38afe3b52a87d6a4a");
  const { data } = await client.get(searchUrl, {
    'js_render': true,
    'premium_proxy': true,
    'wait_for': "#first-property-card",
    'device': 'desktop',
    'block_resources': 'image', // for efficiency 
    "js_instructions": "[{\"scroll_y\":500}]",
    'json_response': true,
  });

  // Parse and extract data points
  const root = parse(data.html);
  const listings = root.querySelectorAll('ul li[data-testid^="srp-home-card-"]');
  const summary = [];
  listings.forEach((el) => {
    const price = el.querySelector('[data-testid="property-price"]')?.textContent;
    const link = baseUrl + el.querySelector('[data-testid="property-card-link"]')?.getAttribute("href")
    if (price) {
      summary.push({
        price: price,
        beds: el.querySelector('[data-testid="property-beds"]')?.textContent,
        baths: el.querySelector('[data-testid="property-baths"]')?.textContent,
        address: el.querySelector('[data-testid="property-address"]')?.textContent,
        link: link,
      });
    }
  });
  return summary
};