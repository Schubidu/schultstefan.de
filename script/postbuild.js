/* eslint-disable no-console */
const { promisify } = require('util');

const fs = require('fs');
const path = require('path');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

String.prototype.replaceAll = function(search, replacement) {
  return this.replace(new RegExp(search, 'g'), replacement);
};
const distPath = path.normalize(`${__dirname}/../dist/`);

async function stringReplaces() {
  const filePath = path.normalize(`${distPath}index.html`);
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
    return await writeFileAsync(filePath, fileContent)
  } catch (err) {
    console.error('ERROR:', err);
  }
}

async function headers() {
  const filePath = `${distPath}_headers`;
  const jsKey = 'all.js';
  const cssKey = 'screen.css';
  const manifest = require(`${distPath}parcel-manifest.json`);
  try {
    const jsValue = manifest[jsKey];
    const cssValue = manifest[cssKey];
    const fileContent = `/
  Link: ${jsValue}; rel=preload; as=script
  Link: ${cssValue}; rel=preload; as=style`;

    return await writeFileAsync(filePath, fileContent)
  } catch (err) {
    console.error('ERROR:', err);
  }
}

stringReplaces();
headers();
