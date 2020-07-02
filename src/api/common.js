import { getCurrentLocale } from '../helpers/util';
import ecosFetch from '../helpers/ecosFetch';

const getOptions = {
  credentials: 'include',
  method: 'get'
};

const postOptions = {
  ...getOptions,
  method: 'post',
  headers: {
    'Content-Type': 'application/json'
  }
};

const putOptions = {
  ...getOptions,
  method: 'put',
  headers: {
    'Content-Type': 'application/json'
  }
};

const deleteOptions = {
  ...getOptions,
  method: 'delete'
};

const loadingCacheByKey = {};

export class CommonApi {
  setNotAuthCallback = cb => {
    this.notAuthCallback = cb;
  };

  checkStatus = response => {
    if (response.status >= 200 && response.status < 300) {
      return response;
    }

    if (response.status === 401 && typeof this.notAuthCallback === 'function') {
      this.notAuthCallback();
    }

    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  };

  getJsonWithSessionCache = config => {
    if (!window.sessionStorage) {
      return this.getJson(config.url);
    }

    let { timeout, onError, url, postProcess, cacheKey } = config;

    let shareProxyUrl = '';
    if (process.env.NODE_ENV === 'development') {
      shareProxyUrl = process.env.REACT_APP_SHARE_PROXY_URL;
    }

    const locale = getCurrentLocale();
    const key = `CommonApi_${locale}_${shareProxyUrl}${url}`;

    let fromLoadingCache = loadingCacheByKey[key];
    if (fromLoadingCache && fromLoadingCache.cacheKey === cacheKey) {
      return fromLoadingCache.promise;
    }

    let result = sessionStorage.getItem(key);
    if (result) {
      let parsedResult = JSON.parse(result);

      if (!cacheKey || parsedResult.cacheKey === cacheKey) {
        if (timeout) {
          if (new Date().getTime() - parsedResult.time < timeout) {
            return Promise.resolve(parsedResult.response);
          }
        } else {
          return Promise.resolve(parsedResult.response);
        }
      }
    }
    const addToStorage = response => {
      sessionStorage.setItem(
        key,
        JSON.stringify({
          time: new Date().getTime(),
          cacheKey: cacheKey,
          response
        })
      );
      return response;
    };

    let resultPromise = this.getJson(url).then(response => {
      if (postProcess) {
        response = postProcess(response);
        if (response.then) {
          return response.then(resp => addToStorage(resp));
        } else {
          return addToStorage(response);
        }
      } else {
        return addToStorage(response);
      }
    });

    if (onError) {
      resultPromise = resultPromise.catch(err => {
        return addToStorage(onError(err));
      });
    }

    loadingCacheByKey[key] = {
      promise: resultPromise,
      cacheKey
    };

    return resultPromise.finally(() => {
      delete loadingCacheByKey[key];
    });
  };

  getCommonHeaders = () => {
    return {
      'Accept-Language': getCurrentLocale()
    };
  };

  getJson = url => {
    return ecosFetch(url, {
      ...getOptions,
      headers: {
        ...this.getCommonHeaders()
      }
    })
      .then(this.checkStatus)
      .then(parseJSON);
  };

  getHtml = url => {
    return ecosFetch(url, {
      ...getOptions,
      headers: {
        ...this.getCommonHeaders()
      }
    })
      .then(this.checkStatus)
      .then(parseHtml);
  };

  deleteJson = (url, notJsonResp) => {
    const prms = ecosFetch(url, {
      ...deleteOptions,
      headers: {
        ...this.getCommonHeaders()
      }
    }).then(this.checkStatus);

    return notJsonResp ? prms : prms.then(parseJSON);
  };

  putJson = (url, data, notJsonResp) => {
    const prms = ecosFetch(url, {
      ...putOptions,
      body: data,
      headers: {
        ...this.getCommonHeaders(),
        ...putOptions.headers
      }
    }).then(this.checkStatus);

    return notJsonResp ? prms : prms.then(parseJSON);
  };

  postJson = (url, data, notJsonResp) => {
    const prms = ecosFetch(url, {
      ...postOptions,
      body: data,
      headers: {
        ...this.getCommonHeaders(),
        ...postOptions.headers
      }
    }).then(this.checkStatus);

    return notJsonResp ? prms.then(resp => resp.text()) : prms.then(parseJSON);
  };
}

export function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

export function parseJSON(response) {
  return response.json();
}

function parseHtml(response) {
  return response.text();
}
