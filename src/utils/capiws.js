const CAPIWS = {
  URL: (window.location.protocol === 'https:' ? 'wss://127.0.0.1:64443' : 'ws://127.0.0.1:64646') + '/service/cryptapi',

  callFunction(funcDef, callback, error) {
    if (!window.WebSocket) {
      error && error();
      return;
    }

    let socket;

    try {
      socket = new WebSocket(this.URL);
    } catch (e) {
      error && error(e);
      return;
    }

    socket.onerror = e => error && error(e);

    socket.onmessage = event => {
      const data = JSON.parse(event.data);
      socket.close();
      callback(event, data);
    };

    socket.onopen = () => {
      socket.send(JSON.stringify(funcDef));
    };
  },
  version: function(callback, error) {
    if (!window.WebSocket) {
      if (error) error();
      return;
    }
    var socket;
    try {
      socket = new WebSocket(this.URL);
    } catch (e) {
      error(e);
    }
    socket.onerror = function(e) {
      if (error) error(e);
    };
    socket.onmessage = function(event) {
      var data = JSON.parse(event.data);
      socket.close();
      callback(event, data);
    };
    socket.onopen = function() {
      var o = { name: 'version' };
      socket.send(JSON.stringify(o));
    };
  },
  apikey: function(domainAndKey, callback, error) {
    if (!window.WebSocket) {
      if (error) error();
      return;
    }
    var socket;
    try {
      socket = new WebSocket(this.URL);
    } catch (e) {
      error(e);
    }
    socket.onclose = function(e) {
      if (error) {
        if (e.code != 1000) {
          error(e.code);
        }
      }
    };
    socket.onmessage = function(event) {
      var data = JSON.parse(event.data);
      socket.close();
      callback(event, data);
    };
    socket.onopen = function() {
      var o = { name: 'apikey', arguments: domainAndKey };
      socket.send(JSON.stringify(o));
    };
  }
};

export default CAPIWS;
