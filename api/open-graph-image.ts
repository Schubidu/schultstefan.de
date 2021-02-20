import type { NowRequest, NowResponse } from '@vercel/node';
import { decode } from 'blurhash';
import { createCanvas } from 'canvas';
import data from '../data.json';

const viewportWidth = 1200;
const viewPortHeight = 630;

function getRandomData() {
  return data[Math.floor(Math.random() * data.length - 1)];
}

module.exports = async (req: NowRequest, res: NowResponse) => {
  try {
    const currentPhoto = await getRandomData();
    if (currentPhoto) {
      const pixels = decode(currentPhoto.blur_hash, 1200, 630);

      const canvas = createCanvas(1200, 630);
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(viewportWidth, viewPortHeight);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
      res.setHeader('Content-type', 'image/png');
      res.send(canvas.toBuffer('image/png'));
    }
  } catch (err) {
    console.error(err);
  }
  return null;
};
