/* eslint-disable no-console */
const { promisify } = require('util');

const fs = require('fs');
const path = require('path');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

String.prototype.replaceAll = function(search, replacement) {
  return this.replace(new RegExp(search, 'g'), replacement);
};
const filePath = path.normalize(`${__dirname}/../dist/index.html`);

async function main() {
  try {
    const fileBuffer = await readFileAsync(filePath);
    const currentUrl = process.env.URL + '/' || './';
    const fileContent = fileBuffer
      .toString()
      .replaceAll('/socialsharing.', `${currentUrl}socialsharing.`)
      .replaceAll('###URL###', `${currentUrl}`);
    await writeFileAsync(filePath, fileContent)
  } catch (err) {
    console.error('ERROR:', err);
  }
}

main();
