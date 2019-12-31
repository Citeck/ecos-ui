import { getCurrentLocale } from '../helpers/util';
import { setIsAuthenticated } from '../actions/user';
import ecosFetch from '../helpers/ecosFetch';
import Records from '../components/Records';

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

export class CommonApi {
  constructor(store) {
    if (store) {
      this.store = store;
    }
  }

  static isUpdatingRecordState = function*({ record }) {
    const getState = () =>
      Records.get(record)
        .load('pendingUpdate?bool', true)
        .then(res => res);

    const pingState = () =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(getState());
        }, 2000);
      });

    let isUpdating = yield getState();
    let attempt = 0;

    while (attempt < 10 && isUpdating) {
      isUpdating = yield pingState().then(res => res);
      attempt++;
    }

    return isUpdating;
  };

  checkStatus = response => {
    if (response.status >= 200 && response.status < 300) {
      return response;
    }

    if (response.status === 401) {
      if (this.store && typeof this.store.dispatch === 'function') {
        this.store.dispatch(setIsAuthenticated(false));
      }
    }

    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  };

  getJsonWithSessionCache = config => {
    if (!window.sessionStorage) {
      return this.getJson(config.url);
    }

    let { timeout, onError, url } = config;

    const locale = getCurrentLocale();
    const key = `CommonApi_${locale}_${url}`;

    let result = sessionStorage.getItem(key);
    if (result) {
      let parsedResult = JSON.parse(result);

      if (timeout) {
        if (new Date().getTime() - parsedResult.time < timeout) {
          return Promise.resolve(parsedResult.response);
        }
      } else {
        return Promise.resolve(parsedResult.response);
      }
    }
    const addToStorage = response => {
      sessionStorage.setItem(
        key,
        JSON.stringify({
          time: new Date().getTime(),
          response
        })
      );
      return response;
    };

    let resultPromise = this.getJson(url).then(response => {
      return addToStorage(response);
    });

    if (onError) {
      resultPromise = resultPromise.catch(err => {
        return addToStorage(onError(err));
      });
    }

    return resultPromise;
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
