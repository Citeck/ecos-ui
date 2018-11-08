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

export class CommonApi {
  alfrescoProxyUri = '/share/proxy/alfresco/';

  getJson = url => {
    return fetch(this.alfrescoProxyUri + url, getOptions)
      .then(checkStatus)
      .then(parseJSON);
  };

  getHtml = url => {
    return fetch(this.alfrescoProxyUri + url, getOptions)
      .then(checkStatus)
      .then(parseHtml);
  };

  postJson = (url, data) => {
    return fetch(this.alfrescoProxyUri + url, {
      ...postOptions,
      body: JSON.stringify(data)
    })
      .then(checkStatus)
      .then(parseJSON);
  };

  // TODO implement postFrom, uploadFile
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

function parseJSON(response) {
  return response.json();
}

function parseHtml(response) {
  return response.text();
}
