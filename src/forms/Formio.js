import Formio from 'formiojs/Formio';
import { jsonLogic } from 'formiojs/utils/utils';
import get from 'lodash/get';

import { getMLValue } from '../helpers/util';

jsonLogic.add_operation('getMLValue', value => getMLValue(value));

const originProviders = Formio.providers;

function getLocalLibraryUrl(src) {
  const replaceUrlMap = {
    // prettier-ignore
    'https://cdn.staticaly.com/gh/formio/ckeditor5-build-classic/v12.2.0-formio.2/build/': 'js/lib/ckeditor5-build-classic/v12.2.0-formio.2/',
    'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.1/': 'js/lib/ace/1.4.1/',
    'https://cdn.quilljs.com/1.3.6/': 'js/lib/quill/1.3.6/'
  };

  for (let url in replaceUrlMap) {
    if (src.startsWith(url)) {
      return src.replace(url, `${import.meta.env.BASE_URL}${replaceUrlMap[url]}`);
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

Formio.forms = {};

Formio.providers = {
  ...originProviders,
  storage: {
    base64: get(originProviders, 'storage.base64'),
    url: get(originProviders, 'storage.url')
  }
};

window.Formio = Formio;

export default Formio;
