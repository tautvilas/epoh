'use strict';

String.prototype.printf = function() {
  var result = this;

  for (var i = 0; i < arguments.length; i++) {
    result = result.replace('_', arguments[i] === undefined ? '' : arguments[i]);
  }

  return result;
};

String.prototype.capitalize = function() {
      return this.charAt(0).toUpperCase() + this.slice(1);
};
