'use strict';

Function.prototype.applyTo = function(proto, params) {
  var O = function() {};
  O.prototype = proto;
  var object = new O();
  this.apply(object, params);
  return object;
};

Function.prototype.boundMemoized = function() {
  if (!this._memo) {
    this._memo = {};
  }
  var currentMap = this._memo;
  for (var i = 0; i < arguments.length; i++) {
    var argument = arguments[i] === undefined ? undefined : arguments[i].toString();
    if (argument && argument.substr(1,6) === 'object') {
      console.error(this.name + ' argument no ' + i + ' does not have toString() defined');
    }
    if (!currentMap[argument]) {
      currentMap[argument] = {};
    }
    currentMap = currentMap[argument];
  }
  if (currentMap.__value) {
    //console.log('MEMO CACHE HIT: ' + this.name);
    return currentMap.__value;
  } else {
    var newArguments = new Array(arguments.length - 1);
    for (i = 1; i < arguments.length; i++) {
      newArguments[i - 1] = arguments[i];
    }
    var value = this.apply(arguments[0], newArguments);
    currentMap.__value = value;
    return value;
  }
};

Function.prototype.memoized = function() {
  var newArguments = new Array(arguments.length + 1);
  for (var i = 1; i < arguments.length + 1; i++) {
    newArguments[i] = arguments[i - 1];
  }
  return this.boundMemoized.apply(this, newArguments);
};
