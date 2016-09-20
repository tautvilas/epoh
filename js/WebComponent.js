'use strict';

var Q = require('./Q');

var WebComponent = function(id, initialState) {
  var state = initialState || {};
  var template = Q.byId(id);

  function updateVal(key) {
    template.querySelector('[data-bind=' + key + ']').textContent = state[key];
  }

  this.setState = function(newState) {
    for (var key in newState) {
      state[key] = newState[key];
      updateVal(key);
    }
  };
};
