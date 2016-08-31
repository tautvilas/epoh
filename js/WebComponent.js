'use strict';

var WebComponent = function(id, initialState) {
  var state = initialState || {};
  var template = $('#' + id);

  function updateVal(key) {
    template.find('[data-bind=' + key + ']').text(state[key]);
  }

  this.setState = function(newState) {
    for (var key in newState) {
      state[key] = newState[key];
      updateVal(key);
    }
  };
};
