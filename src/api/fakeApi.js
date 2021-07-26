export const fakeApi = {
  getSmallLogoSrc: themeName => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`/share/res/themes/${themeName}/images/app-logo-mobile.png`);
      }, 0);
    });
  },

  getLargeLogoSrc: themeName => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`/share/res/themes/${themeName}/images/app-logo-48.png`);
      }, 0);
    });
  }
};
