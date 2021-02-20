import unsplash from './unsplash';

(async () => {
  const currentPhoto = await unsplash();
  if (currentPhoto?.color) {
    currentPhoto?.color;
  }
})();

export default 'foo';
