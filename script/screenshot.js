const path = require('path');
const puppeteer = require('puppeteer');

let pathFile = `file://${path.normalize(`${__dirname}/../dist/index.html#card`)}`;

if(process.env.NODE_ENV === 'development') {
  pathFile = 'http://localhost:1234/index.html#card'
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({width: 300, height: 175, deviceScaleFactor: 2.5});
  await page.goto(pathFile);
  await page.screenshot({path: 'app/assets/socialsharing.png'});
  await browser.close();
  console.log('updated screenshot for socialsharing');
})();
