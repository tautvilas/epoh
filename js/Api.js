'use strict';

var Game = require('./Game');
var Config = require('./Config');
var Map = require('./Map');
var Intent = require('./Intent');

var Api = function() {
  var self = this;

  this.game = new Game(new Map(Config.MAP_SEED));

  function j(data) {
    return JSON.parse(JSON.stringify(data));
  }

  this.getSector = function(s, username) {
    return Promise.resolve(j(self.game.getSector(s, username)));
  };

  this.getSectors = function(sectors, username) {
    var response = [];
    sectors.forEach(function(s) {
      response.push(self.game.getSector(s, username));
    });
    return Promise.resolve(j(response));
  };

  this.addPlayer = function(name) {
    return Promise.resolve(j(self.game.addPlayer(name)));
  };

  this.getStatus = function(name) {
    return Promise.resolve(j(self.game.getStatus(name)));
  };

  this.addIntent = function(name, intent) {
    return Promise.resolve(j(self.game.addIntent(name, Intent.fromJson(j(intent)))));
  };

  this.cancelIntents = function(name, coords) {
    return Promise.resolve(j(self.game.cancelIntents(name, coords.toString())));
  };

  this.checkSession = function() {
    return Promise.resolve(false);
  };

  this.endTurn = function(name) {
    return Promise.resolve(j(self.game.endTurn(name)));
  };

  this.listen = function(f) {
    self.game.events.onValue(function(value) {
      f(j(value));
    });
  };
};
