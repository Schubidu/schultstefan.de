/* eslint-disable no-console */
const { promisify } = require("util");

const dotenv = require("dotenv");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const writeFileAsync = promisify(fs.writeFile);

const distPath = path.normalize(`${__dirname}/../app/`);

// loading .env
const result = dotenv.config();

if (result.error) {
  console.log('no file .env found');
}

async function getUnsplashImage() {
  const collections = [
    827751, //https://unsplash.com/collections/827751/architectural
  ].join(',');
  return await fetch(`https://api.unsplash.com/photos/random?collections=${collections}&orientation=landscape&client_id=${process.env.UNSPLASH_APP_SECRET}`).then(res => res.json());
}


const asyncProcessor = [
  async function loadUnsplashData() {
    const filePath = `${distPath}unsplash-data.json`;
    try {
      const {
        id,
        color,
        user: {
          name,
          links: { html }
        },
        urls
      } = await getUnsplashImage();
      const fileContent = JSON.stringify({id, color, urls, user: {name, links: {html}}}, null, 2);
      await writeFileAsync(filePath, fileContent);
      return Promise.resolve({});
    } catch (err) {
      console.error("ERROR:", err);
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
    // await Promise.all(toDelete.map(filePath => unlinkAsync(filePath)));
  } catch (err) {
    console.error("ERROR:", err);
  }
}

main();
