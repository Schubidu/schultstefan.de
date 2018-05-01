const crypto = require("crypto");
const path = require("path");
const puppeteer = require("puppeteer");

let pathFile = `file://${path.normalize(
  `${__dirname}/../dist/index.html#card`
)}`;

if (process.env.NODE_ENV === "development") {
  pathFile = "http://localhost:1234/index.html#card";
}

module.exports = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 300, height: 175, deviceScaleFactor: 2.5 });
  await page.goto(pathFile);
  const image = await page.screenshot();
  const hash = crypto.createHash("sha1");

  const fileHash = hash
    .update(image.toString())
    .digest("hex")
    .substring(0, 8);
  await browser.close();
  console.log("updated screenshot for socialsharing");
  return {
    content: image,
    name: `socialsharing.${fileHash}.png`
  };
};
