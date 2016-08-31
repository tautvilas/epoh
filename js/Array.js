'use strict';

Array.prototype.contains = function(needle) {
  return this.indexOf(needle) !== -1;
};
