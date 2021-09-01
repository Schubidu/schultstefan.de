/* eslint-disable no-console */
import dotenv from 'dotenv';
import { mkdir, writeFile } from 'fs';
import fetch from 'node-fetch';
import path, { join } from 'path';
import pkg from 'prettier';
import { promisify } from 'util';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const { format, resolveConfig } = pkg;
const writeFileAsync = promisify(writeFile);
const mkdirAsync = promisify(mkdir);

const fileTemplate = (images) => `
export default {${images}} as const
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
  ).then((res) => res.json());
  const totalPages = Math.ceil(totalPhotos / 25);
  console.log({ totalPhotos, totalPages, randomPage: Math.ceil(Math.random(totalPages) * totalPages) });
  // load only the first 25 images
  const data = await fetch(
    `https://api.unsplash.com/collections/${collection}/photos?page=${1}&per_page=${25}&client_id=${
      process.env.UNSPLASH_APP_SECRET
    }`
  ).then((res) => res.json());
  // console.log(data);
  return data;
}

function reduceData(data) {
  const {
    id,
    color,
    blur_hash: blurHash,
    user: {
      name,
      links: { html },
    },
    urls,
  } = data;
  return { id, color, blurHash, urls, user: { name, links: { html } } };
}

const formatContent = async (content) => {
  const options = await resolveConfig(process.cwd());
  return format(content, { ...options, parser: 'typescript' });
};

const asyncProcessor = [
  async function loadUnsplashCollectionData() {
    const dirPath = 'src/unsplash-images/';
    mkdirAsync(join(__dirname, '../', dirPath), { recursive: true });
    try {
      const data = await getUnsplashCollection();
      const reducedData = data.map(reduceData);
      await writeFileAsync(join(__dirname, '../data.json'), JSON.stringify(data, null, 2));
      // writing images data
      await Promise.all(
        reducedData.map(async (fileData) => {
          const fileContent = await formatContent(`export default ${JSON.stringify(fileData, null, 2)};`);
          writeFileAsync(`${dirPath}${fileData.id}.ts`, fileContent);
        })
      );

      // writing index-file
      const fileContent = await formatContent(
        fileTemplate(reducedData.map(({ id }) => `\n  "${id}": () => import("./${id}")`).join(','))
      );
      await writeFileAsync(`${dirPath}index.ts`, fileContent);
      return Promise.resolve({});
    } catch (err) {
      console.error('ERROR:', err);
    }
  },
];

async function main() {
  try {
    await Promise.all(asyncProcessor.map((fn) => fn()));
  } catch (err) {
    console.error('ERROR:', err);
  }
}

main();
