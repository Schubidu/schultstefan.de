import initializeContactEmail from './contactEmail';
import initializeBackground from './unsplash';

initializeBackground().catch((error) => {
  console.error('Unable to initialize the background experience.', error);
});

initializeContactEmail();
