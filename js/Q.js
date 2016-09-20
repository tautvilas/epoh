var Q = {};

Q.byId = function(id) {
  return document.getElementById(id);
};

Q.create = function(tag) {
  return document.createElement(tag);
};

module.exports = Q;
