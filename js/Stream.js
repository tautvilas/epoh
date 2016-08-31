'use strict';

var Stream = function() {
  this.listeners = [];

  this.push = function(value) {
    this.listeners.forEach(function(listener) {
      listener(value);
    });
  };

  this.onValue = function(listener) {
    this.listeners.push(listener);
  };

};

module.exports = Stream;
