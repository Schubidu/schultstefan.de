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
    const url = process.env.URL + '/' || './';
    const deployUrl = process.env.DEPLOY_URL + '/' || './';
    const fileContent = fileBuffer
      .toString()
      .replaceAll('/socialsharing.', `${deployUrl}socialsharing.`)
      .replaceAll('###URL###', `${url}`)
      .replaceAll('class="hide"', `class="hide" viewBox="0 0 300 100"`)
      .replaceAll('class="i"', `class="i" viewBox="0 0 100 100"`)
    await writeFileAsync(filePath, fileContent)
  } catch (err) {
    console.error('ERROR:', err);
  }
}

main();
