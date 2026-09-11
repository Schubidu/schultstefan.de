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

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unsplash request failed with ${response.status}`);
  }

  return response.json();
}

async function getUnsplashCollection(secret) {
  // 827751, // https://unsplash.com/collections/827751/architectural
  const collection = '827751';
  const collectionData = await fetchJson(`https://api.unsplash.com/collections/${collection}?client_id=${secret}`);

  console.log({ totalPhotos: collectionData.total_photos });

  // load only the first 25 images
  return fetchJson(`https://api.unsplash.com/collections/${collection}/photos?page=1&per_page=25&client_id=${secret}`);
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

async function loadUnsplashCollectionData(secret) {
  const dirPath = 'src/unsplash-images/';

  await mkdirAsync(join(__dirname, '../', dirPath), { recursive: true });

  const data = await getUnsplashCollection(secret);
  const reducedData = data.map(reduceData);

  await writeFileAsync(join(__dirname, '../data.json'), JSON.stringify(data, null, 2));
  await Promise.all(
    reducedData.map(async (fileData) => {
      const fileContent = await formatContent(`export default ${JSON.stringify(fileData, null, 2)};`);

      return writeFileAsync(`${dirPath}${fileData.id}.ts`, fileContent);
    })
  );

  const fileContent = await formatContent(
    fileTemplate(reducedData.map(({ id }) => `\n  "${id}": () => import("./${id}")`).join(','))
  );

  await writeFileAsync(`${dirPath}index.ts`, fileContent);
}

async function main() {
  const secret = process.env.UNSPLASH_APP_SECRET;

  if (!secret) {
    console.log('Skipping Unsplash refresh because UNSPLASH_APP_SECRET is not configured.');
    return;
  }

  await loadUnsplashCollectionData(secret);
}

main().catch((error) => {
  console.error('ERROR:', error);
  process.exitCode = 1;
});
