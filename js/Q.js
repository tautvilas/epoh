var Q = {};

Q.byId = function(id) {
  return document.getElementById(id);
};

Q.create = function(tag) {
  return document.createElement(tag);
};

Q.byTag = function(tag) {
  return document.getElementsByTagName(tag);
};

module.exports = Q;
