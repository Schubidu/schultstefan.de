import type { NowRequest, NowResponse } from '@vercel/node';
import { decode } from 'blurhash';
import { createCanvas } from 'canvas';
import { getRandomImageData } from '../src/unplashPhoto';

const viewportWidth = 1200;
const viewPortHeight = 630;

module.exports = async (req: NowRequest, res: NowResponse) => {
  try {
    const currentPhoto = await getRandomImageData();
    const pixels = decode(currentPhoto.blurHash, 1200, 630);

    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(viewportWidth, viewPortHeight);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
    res.setHeader('Content-type', 'image/png');
    res.send(canvas.toBuffer('image/png'));
  } catch (err) {
    console.error(err);
    return null;
  }
};
