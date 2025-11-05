function getCookie(name) {
  var matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

(function() {

  if (typeof window.Citeck === "undefined" || !window.Citeck) {
    window.Citeck = {};
  }

  window.Citeck.helpers = window.Citeck.helpers || {};

  window.Citeck.helpers.getCurrentLocale = function() {
    const manualLocale = getCookie("alf_share_locale");
    if (manualLocale) {
      return manualLocale;
    }

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

})();


