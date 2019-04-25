import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';
import $ from 'jquery';

export const getURLParameterByName = function(name) {
  name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
    results = regex.exec(window.location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

export const setURLParameter = function(key, value) {
  key = encodeURI(key);
  value = encodeURI(value);
  var kvp = document.location.search.substr(1).split('&');
  var i = kvp.length;
  var x;
  while (i--) {
    x = kvp[i].split('=');
    if (x[0] === key) {
      x[1] = value;
      kvp[i] = x.join('=');
      break;
    }
  }
  if (i < 0) {
    kvp[kvp.length] = [key, value].join('=');
  }
  var newUrl = window.location.href.split('?')[0] + '?' + kvp.join('&');
  window.history.pushState({ path: newUrl }, '', newUrl);
};

export const requireInOrder = function(dependencies, callback) {
  return new Promise((resolve, reject) => {
    let scope = this;
    let orderedRequire = function(dependencies, idx, modules) {
      if (idx >= dependencies.length) {
        if (callback) {
          callback.apply(scope, modules);
        }
        resolve(modules);
      } else {
        const controlUrl = `/share/res/${dependencies[idx]}.js`;
        window.require([controlUrl], function(module) {
          modules.push(module);
          orderedRequire(dependencies, idx + 1, modules);
        });
      }
    };
    orderedRequire(dependencies, 0, []);
  });
};

export const loadHtml = function(url, args, htmlDest, successCallback, failureCallback) {
  let config;
  if (isObject(arguments[0])) {
    config = arguments[0];
  } else {
    config = {
      url: url,
      args: args,
      htmlDest: htmlDest,
      jsDest: null,
      jsInlineDest: null,
      cssDest: null,
      onSuccess: successCallback,
      onFailure: failureCallback
    };
  }

  if (!config.jsInlineDest) {
    config.jsInlineDest = function(scripts) {
      for (let i = 0; i < scripts.length; i++) {
        try {
          const script = document.createElement('script');
          script.textContent = scripts[i];
          document.body.appendChild(script);
          // eslint-disable-next-line
          // eval(scripts[i]);
        } catch (e) {
          console.error('Exception while eval scripts from loadHtml with config', config, e);
          throw e;
        }
      }
    };
  }

  if (!config.jsDest) {
    config.jsDest = function(scripts) {
      return requireInOrder(scripts);
    };
  }

  if (!config.cssDest) {
    config.cssDest = function(cssData) {
      window.require(cssData);
    };
  }

  if (!isFunction(config.htmlDest)) {
    let targetId = config.htmlDest;
    config.htmlDest = function(text) {
      $(targetId).html(text);
    };
  }

  let invokeCallback = function(callback, param) {
    let scope = null;
    let func = null;
    if (callback) {
      if (callback.fn) {
        func = callback.fn;
        scope = callback.scope;
      } else {
        func = callback;
      }
    }
    if (func) {
      if (param) {
        func.call(scope, param);
      } else {
        func.call(scope);
      }
    }
  };

  let fullUrl = config.url + (config.args ? '?' + $.param(config.args) : '');

  return fetch(fullUrl, {
    credentials: 'include'
  })
    .then(response => {
      return response.text();
    })
    .then(text => {
      let scriptSrcRegexp = /<script type="text\/javascript" src="\/share\/res\/(\S+)_[^_]+?\.js"><\/script>/g;
      let jsDependencies = [];
      text = text.replace(scriptSrcRegexp, function(match, jsSrc) {
        let excludedSources = ['jquery/jquery', 'js/citeck/lib/polyfill/babel-polyfill', 'js/citeck/lib/polyfill/fetch'];
        if (excludedSources.indexOf(jsSrc) === -1) {
          jsDependencies.push(jsSrc);
        }
        return '';
      });

      let inlineScriptsRegexp = /<script type="text\/javascript">([\S\s]+?)<\/script>/g;
      let inlineScripts = [];
      text = text.replace(inlineScriptsRegexp, function(match, jsText) {
        inlineScripts.push(jsText);
        return '';
      });

      let cssSrcRegexp = /@import url\("\/share\/res\/(\S+)_[^_]+?\.css"\);/g;
      let cssDependencies = [];
      text = text.replace(cssSrcRegexp, function(match, cssSrc) {
        cssDependencies.push('xstyle!' + cssSrc + '.css');
        return '';
      });

      try {
        config.cssDest(cssDependencies);
        config.htmlDest(text);
        let promise = config.jsDest(jsDependencies);
        if (promise) {
          promise.then(() => {
            config.jsInlineDest(inlineScripts);
            invokeCallback(config.onSuccess);
          });
        } else {
          config.jsInlineDest(inlineScripts);
          invokeCallback(config.onSuccess);
        }
      } catch (e) {
        console.error('Error while process html data for config', config, e);
        throw e;
      }
    })
    .catch(function(response) {
      console.error('Fetch error while load html for config', config, response);
      invokeCallback(config.onFailure, response);
    });
};
