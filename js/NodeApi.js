'use strict';

var Api = function() {
  this.getSector = function(s) {
    return $.get('/sector/_'.printf(s));
  };

  this.getSectors = function(s) {
    return $.get('/sector/_'.printf(s.join(',')));
  };

  this.addPlayer = function(name) {
    return $.post('/player/_'.printf(name));
  };

  this.checkSession = function() {
    return $.get('/session');
  };

  this.getStatus = function(name) {
    return $.get('/player/_'.printf(name));
  };

  this.cancelIntents = function(name, coords) {
    return $.ajax({
      url: '/tile/_/intents'.printf(coords),
      type: 'DELETE',
      processData: false,
      contentType: 'application/json',
      dataType: 'json'
    });
  };

  this.addIntent = function(name, tile) {
    return $.ajax({
      url: '/intent',
      type: 'POST',
      processData: false,
      contentType: 'application/json',
      data: JSON.stringify(tile),
      dataType: 'json'
    });
  };

  this.endTurn = function() {
    $.post('/turn');
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
