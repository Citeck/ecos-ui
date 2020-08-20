import Formio from 'formiojs/Formio';

function getLocalLibraryUrl(src) {
  const replaceUrlMap = {
    // prettier-ignore
    'https://cdn.staticaly.com/gh/formio/ckeditor5-build-classic/v12.2.0-formio.2/build/': '/js/lib/ckeditor5-build-classic/v12.2.0-formio.2/',
    'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.1/': '/js/lib/ace/1.4.1/',
    'https://cdn.quilljs.com/1.3.6/': '/js/lib/quill/1.3.6/'
  };

  for (let url in replaceUrlMap) {
    if (src.startsWith(url)) {
      return src.replace(url, `${process.env.PUBLIC_URL}${replaceUrlMap[url]}`);
    }
  }

  return src;
}

const originalRequireLibrary = Formio.requireLibrary;
Formio.requireLibrary = (name, property, src, polling) => {
  src = Array.isArray(src) ? src : [src];
  src = src.map(lib => {
    if (typeof lib === 'string') {
      return getLocalLibraryUrl(lib);
    } else if (lib.hasOwnProperty('src')) {
      lib.src = getLocalLibraryUrl(lib.src);
    }

    return lib;
  });

  return originalRequireLibrary(name, property, src, polling);
};

export default Formio;
