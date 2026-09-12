import dotenv from 'dotenv';
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fetch from 'node-fetch';
import pkg from 'prettier';

const { format, resolveConfig } = pkg;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const photosDir = path.join(root, 'src/unsplash-images');
const defaultCollectionId = '827751';

dotenv.config();

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unsplash request failed with ${response.status}`);
  }

  return response.json();
}

async function getCollection(secret, collectionId) {
  return fetchJson(
    `https://api.unsplash.com/collections/${collectionId}/photos?page=1&per_page=25&client_id=${secret}`
  );
}

function reducePhoto(data) {
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

async function formatTypeScript(content) {
  const options = await resolveConfig(path.join(photosDir, 'index.ts'));

  return format(content, { ...options, parser: 'typescript' });
}

async function clearRegistry() {
  await mkdir(photosDir, { recursive: true });

  const files = await readdir(photosDir);

  await Promise.all(files.filter((file) => file.endsWith('.ts')).map((file) => unlink(path.join(photosDir, file))));
}

async function writeRegistry(photos) {
  await clearRegistry();

  await Promise.all(
    photos.map(async (photo) => {
      const content = await formatTypeScript(`export default ${JSON.stringify(photo, null, 2)};`);

      await writeFile(path.join(photosDir, `${photo.id}.ts`), content);
    })
  );

  const entries = photos
    .map(({ id }) => `\n  ${JSON.stringify(id)}: () => import(${JSON.stringify(`./${id}`)})`)
    .join(',');
  const index = await formatTypeScript(`export default {${entries}} as const;`);

  await writeFile(path.join(photosDir, 'index.ts'), index);
}

async function main() {
  const secret = process.env.UNSPLASH_APP_SECRET;
  const collectionId = process.env.UNSPLASH_COLLECTION_ID || defaultCollectionId;

  if (!secret) {
    throw new Error('UNSPLASH_APP_SECRET is required to refresh the photo registry.');
  }

  const photos = (await getCollection(secret, collectionId)).map(reducePhoto);

  await writeRegistry(photos);
  console.log(`Updated photo registry with ${photos.length} photos from collection ${collectionId}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
