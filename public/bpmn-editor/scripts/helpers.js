(function() {

  if (typeof window.Citeck === "undefined" || !window.Citeck) {
    window.Citeck = {};
  }

  window.Citeck.helpers = window.Citeck.helpers || {};

  window.Citeck.helpers.getCurrentLocale = function() {
    if (!window.navigator) {
      return 'en';
    }

    var language = navigator.languages ? navigator.languages[0] : navigator.language || navigator.systemLanguage || navigator.userLanguage;

    return language.substr(0, 2).toLowerCase();
  };

  window.Citeck.helpers.dynamicallyLoadScript = function(url, callback) {
    var script = document.createElement("script");
    script.src = url;

    document.body.appendChild(script);
    if (typeof callback === 'function') {
      script.onload = callback;
    }
  };

  window.Citeck.helpers.checkStatus = function(response) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    }
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  };

  window.Citeck.helpers.parseJSON = function(response) {
    return response.json();
  };

  // TODO
  window.Citeck.helpers.getCurrentThemeName = function() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('citeckTheme');
      }, 0);
    });
  };

})();


