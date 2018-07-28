/* eslint-disable no-console */
const { promisify } = require('util');

const dotenv = require('dotenv');
const fetch = require('node-fetch');
const fs = require('fs');
const prettier = require('prettier');

const writeFileAsync = promisify(fs.writeFile);

const fileTemplate = images => `const asyncImages = {${images}
};

export const fetchImageData = async id => {
  if (!asyncImages[id]) return Promise.resolve({});
  const { default: data } = await asyncImages[id]();
  return data;
}

export const hasImage = async id => Object.keys(asyncImages).includes(id);

export const getRandomImage = async () => {
  const keys = Object.keys(asyncImages);

  return keys[Math.floor(Math.random() * keys.length)];
};


export const getRandomImageData = async () => {
  const keys = Object.keys(asyncImages);

  const randomKey = keys[Math.floor(Math.random() * keys.length)];

  return fetchImageData(randomKey);
};
`;

// loading .env
const result = dotenv.config();

if (result.error) {
  console.log('no file .env found');
}

async function getUnsplashCollection() {
  // 827751, // https://unsplash.com/collections/827751/architectural
  const collection = '827751';
  const { total_photos: totalPhotos } = await fetch(
    `https://api.unsplash.com/collections/${collection}?client_id=${process.env.UNSPLASH_APP_SECRET}`
  ).then(res => res.json());
  const data = await Promise.all(
    [...Array(Math.ceil(totalPhotos / 25))]
      .map(
        (x, idx) =>
          `https://api.unsplash.com/collections/${collection}/photos?page=${idx + 1}&per_page=${25}&client_id=${
            process.env.UNSPLASH_APP_SECRET
          }`
      )
      .map(url => fetch(url).then(res => res.json()))
  );
  return data.reduce((acc, pageData) => [...acc, ...pageData], []);
}

function reduceData(data) {
  const {
    id,
    color,
    user: {
      name,
      links: { html },
    },
    urls,
  } = data;
  return { id, color, urls, user: { name, links: { html } } };
}

const formatContent = async content => {
  const options = await prettier.resolveConfig(process.cwd());
  return prettier.format(content, { ...options, parser: 'babylon' });
};

const asyncProcessor = [
  async function loadUnsplashCollectionData() {
    const dirPath = 'app/js/unsplash-images/';
    try {
      const data = await getUnsplashCollection();
      const reducedData = data.map(reduceData);
      console.log(reducedData.length);
      // writing images data
      await Promise.all(
        reducedData.map(async fileData => {
          const fileContent = await formatContent(`export default ${JSON.stringify(fileData, null, 2)}`);
          writeFileAsync(`${dirPath}${fileData.id}.js`, fileContent);
        })
      );

      // writing index-file
      const fileContent = await formatContent(
        fileTemplate(reducedData.map(({ id }) => `\n  "${id}": () => import("./${id}")`).join(','))
      );
      await writeFileAsync(`${dirPath}index.js`, fileContent);
      return Promise.resolve({});
    } catch (err) {
      console.error('ERROR:', err);
    }
  },
];

async function main() {
  try {
    await Promise.all(asyncProcessor.map(fn => fn()));
  } catch (err) {
    console.error('ERROR:', err);
  }
}

main();
