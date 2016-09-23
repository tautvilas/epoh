'use strict';

var Http = require('./Http');

var Api = function() {
  this.getSector = function(s) {
    return Http.get('/sector/_'.printf(s));
  };

  this.getSectors = function(s) {
    return Http.get('/sector/_'.printf(s.join(',')));
  };

  this.addPlayer = function(name) {
    return Http.post('/player/_'.printf(name));
  };

  this.checkSession = function() {
    return Http.get('/session');
  };

  this.getStatus = function(name) {
    return Http.get('/player/_'.printf(name));
  };

  this.cancelIntents = function(name, coords) {
    return Http.delete('/tile/_/intents'.printf(coords));
  };

  this.addIntent = function(name, tile) {
    return Http.post('/intent', tile);
  };

  this.endTurn = function() {
    return Http.post('/turn');
  };

  this.listen = function(f) {
    var connection = new WebSocket('ws://_:1337'.printf(window.location.hostname));
    /*
    connection.onopen = function() {
      connection.send(window.document.cookie);
    };
    */
    connection.onmessage = function(message) {
      f(JSON.parse(message.data));
    };
  };
};
