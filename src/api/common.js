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

// const postUrlEncodedFormOptions = {
//   ...getOptions,
//   method: 'post',
//   headers: {
//     'Content-Type': 'application/x-www-form-urlencoded'
//   }
// };

// const prepareUrlEncodedFormData = (params) => {
//   return Object.keys(params).map((key) => {
//     return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
//   }).join('&');
// };

export class CommonApi {
  getJson = url => {
    return fetch(url, getOptions)
      .then(checkStatus)
      .then(parseJSON);
  };

  getHtml = url => {
    return fetch(url, getOptions)
      .then(checkStatus)
      .then(parseHtml);
  };

  postJson = (url, data) => {
    return fetch(url, {
      ...postOptions,
      body: JSON.stringify(data)
    })
      .then(checkStatus)
      .then(parseJSON);
  };

  // postUrlEncodedForm = (url, data) => {
  //   return fetch(url, {
  //     ...postUrlEncodedFormOptions,
  //     body: prepareUrlEncodedFormData(data)
  //   });
  // };

  // TODO implement uploadFile
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
