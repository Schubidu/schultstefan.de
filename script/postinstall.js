/* eslint-disable no-console */
const { promisify } = require("util");

const dotenv = require("dotenv");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const writeFileAsync = promisify(fs.writeFile);

const distPath = path.normalize(`${__dirname}/../app/`);

const fileTemplate = images => `const asyncImages = {${images}
};

export const fetchImageData = async id => {
  if (!asyncImages[id]) return Promise.resolve({});
  const { data } = await asyncImages[id]();
  return data;
}

export const getRandomImageData = async () => {
  const keys = Object.keys(asyncImages);

  const randomKey = keys[Math.floor(Math.random() * keys.length)];

  return fetchImageData(randomKey);
};
`;

// loading .env
const result = dotenv.config();

if (result.error) {
  console.log("no file .env found");
}

async function getUnsplashImage() {
  const collections = [
    827751 //https://unsplash.com/collections/827751/architectural
  ].join(",");
  return await fetch(
    `https://api.unsplash.com/photos/random?collections=${collections}&orientation=landscape&client_id=${
      process.env.UNSPLASH_APP_SECRET
    }`
  ).then(res => res.json());
}

async function getUnsplashCollection() {
  const collections = [
    827751 //https://unsplash.com/collections/827751/architectural
  ].join(",");
  const { total_photos } = await fetch(
    `https://api.unsplash.com/collections/${827751}?client_id=${
      process.env.UNSPLASH_APP_SECRET
    }`
  ).then(res => res.json());
  const data = await Promise.all(
    [...Array(Math.ceil(total_photos / 25))]
      .map(
        (x, idx) =>
          `https://api.unsplash.com/collections/${827751}/photos?page=${idx +
            1}&per_page=${25}&client_id=${process.env.UNSPLASH_APP_SECRET}`
      )
      .map(url => fetch(url).then(res => console.log({ res }) || res.json()))
  );
  return data.reduce(
    (acc, pageData) => console.log({ pageData }) || [...acc, ...pageData],
    []
  );
}

function reduceData(data) {
  const {
    id,
    color,
    user: {
      name,
      links: { html }
    },
    urls
  } = data;
  return { id, color, urls, user: { name, links: { html } } };
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
      const fileContent = JSON.stringify(
        { id, color, urls, user: { name, links: { html } } },
        null,
        2
      );
      await writeFileAsync(filePath, fileContent);
      return Promise.resolve({});
    } catch (err) {
      console.error("ERROR:", err);
    }
  },
  async function loadUnsplashCollectionData() {
    const dirPath = "app/js/unsplash-images/";
    try {
      const data = await getUnsplashCollection();
      const reducedData = data.map(reduceData);
      console.log(reducedData.length);
      // writing images data
      await Promise.all(
        reducedData.map(fileData =>
          writeFileAsync(
            `${dirPath}${fileData.id}.js`,
            `export const data = ${JSON.stringify(fileData, null, 2)}`
          )
        )
      );

      // writing index-file
      const fileContent = fileTemplate(
        reducedData
          .map(({ id }) => `\n  "${id}": () => import("./${id}")`)
          .join(",")
      );
      await writeFileAsync(`${dirPath}index.js`, fileContent);
      return Promise.resolve({});
    } catch (err) {
      console.error("ERROR:", err);
    }
  }
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
