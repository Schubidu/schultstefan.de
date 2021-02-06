export interface ImageType {
  default: {
    id: string;
    color: string;
    blurHash: string;
    urls: {
      raw: string;
      full: string;
      regular: string;
      small: string;
      thumb: string;
    };
    user: {
      name: string;
      links: {
        html: string;
      };
    };
  };
}

export interface AsyncImages {
  [key: string]: () => Promise<ImageType>;
}
