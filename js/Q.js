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

Q.byClass = function(cl) {
  return document.getElementsByClassName(cl);
};

module.exports = Q;
