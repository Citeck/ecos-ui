import ecosFetch from '../../../helpers/ecosFetch';

class Ajax {
  contentTypes = {
    FORM: 'application/x-www-form-urlencoded',
    JSON: 'application/json',
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE'
  };

  jsonPost(config = {}) {
    config.headers = {
      Accept: this.contentTypes.JSON,
      'Content-Type': this.contentTypes.JSON
    };
    config.method = this.contentTypes.POST;
    config.body = config.dataObj;

    this.request(config);
  }

  request(config = {}) {
    const { url, ...options } = config;

    ecosFetch(url, options)
      .then(response => response.json())
      .then(json => ({ json }))
      .then(body => {
        config.successCallback.fn(body);
      })
      .catch(error => {
        config.failureCallback.fn(error);
      });
  }
}

export default new Ajax();
