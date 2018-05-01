/* eslint-disable no-console */
const { promisify } = require("util");

const fs = require("fs");
const path = require("path");
const screenshot = require('./screenshot');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

String.prototype.replaceAll = function(search, replacement) {
  return this.replace(new RegExp(search, "g"), replacement);
};
const distPath = path.normalize(`${__dirname}/../dist/`);

async function getUnsplashImage() {
  return Promise.resolve(require("../app/unsplash-data"));
}

async function readHtml() {
  const filePath = path.normalize(`${distPath}index.html`);
  try {
    const fileBuffer = await readFileAsync(filePath);
    return {
      filePath,
      content: fileBuffer.toString()
    };
  } catch (err) {
    console.error("ERROR:", err);
  }
}

const asyncProcessor = [
  async function stringReplacesInHtml() {
    try {
      const { content: fileContent, filePath } = await readHtml();
      const url = process.env.URL + "/" || "./";
      const deployUrl = (process.env.DEPLOY_URL) ? process.env.DEPLOY_URL + "/" : "./";
      const { content: imageContent, name: imageName} = await screenshot();
      const replacedContent = fileContent
        .replaceAll(/socialsharing\.(.*)\.png/gm, `${deployUrl}${imageName}`)
        .replaceAll("###URL###", `${url}`)
        .replaceAll('class="hide"', `class="hide" viewBox="0 0 300 100"`)
        .replaceAll('class="i"', `class="i" viewBox="0 0 100 100"`);
      await writeFileAsync(`${distPath}${imageName}`, imageContent);
      await writeFileAsync(filePath, replacedContent);
    } catch (err) {
      console.error("ERROR:", err);
    }
  },

  async function headers() {
    const manifestPath = `${distPath}parcel-manifest.json`;
    const filePath = `${distPath}_headers`;
    const jsKey = "all.js";
    const cssKey = "screen.css";
    try {
      const manifest = require(manifestPath);
      const jsValue = manifest[jsKey];
      const cssValue = manifest[cssKey];
      const fileContent = `/
  Link: ${jsValue}; rel=preload; as=script
  Link: ${cssValue}; rel=preload; as=style`;

      await writeFileAsync(filePath, fileContent);
      return Promise.resolve({ toDelete: [manifestPath, manifestPath] });
    } catch (err) {
      // console.error("ERROR:", err);
    }
  },
];

async function main() {
  const cleanupArrays = ["toDelete"];
  try {
    const filesToCleanup = await Promise.all(asyncProcessor.map(fn => fn()));
    const { toDelete = [] } = filesToCleanup.reduce((acc, method) => {
      let curAcc = {};
      cleanupArrays.forEach(cleanup => {
        if (method) {
          if (method[cleanup]) {
            curAcc[cleanup] = [
              ...(acc[cleanup] || []),
              ...method[cleanup]
            ].filter((v, i, a) => a.indexOf(v) === i);
          }
        }
      });
      return curAcc;
    }, {});

    // delete unnecessary  files
    await Promise.all(toDelete.map(filePath => unlinkAsync(filePath)));
  } catch (err) {
    console.error("ERROR:", err);
  }
}

main();
