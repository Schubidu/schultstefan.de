((doc, documentElement, body) => {
  const {
    color,
    user: {
      name: unsplashUser,
      links: { html: unsplashProfil }
    },
    urls: { full: unsplashFull, regular: unsplashRegular, small: unsplashSmall }
  } = require("../unsplash-data");

  documentElement.style.setProperty("--unsplash-color", color);
  documentElement.style.setProperty("--unsplash-full", `url(${unsplashFull})`);
  documentElement.style.setProperty(
    "--unsplash-regular",
    `url(${unsplashRegular})`
  );
  documentElement.style.setProperty(
    "--unsplash-small",
    `url(${unsplashSmall})`
  );

  const aside = doc.createElement("aside");
  aside.innerHTML = `Photo by <a href="${unsplashProfil}?utm_source=Stefan%27s%20Photo%20App%20Example%0D%0ADemo&utm_medium=referral" rel=”nofollow”>${unsplashUser}</a> on <a href="https://unsplash.com/?utm_source=Stefan%27s%20Photo%20App%20Example%0D%0ADemo&utm_medium=referral" rel=”nofollow”>Unsplash</a>`;

  body.append(aside);
})(document, document.documentElement, document.body);
