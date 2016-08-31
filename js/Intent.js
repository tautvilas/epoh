'use strict';

var Coords = require('./Coords');

var Intent = function(src, dst, type) {
  this.src = src;
  this.dst = dst;
  this.type = type;
};

Intent.fromJson = function(json) {
  var src = new Coords(json.src.x, json.src.y);
  var dst = new Coords(json.dst.x, json.dst.y);
  return new Intent(src, dst, json.type);
};

Intent.MOVE = 'move';
Intent.BOMBARD = 'bombard';
Intent.MINE = 'mine';
Intent.BIGMINE = 'bigmine';
Intent.AMPLIFIER = 'amplifier';
Intent.POWERPLANT = 'powerplant';
Intent.UNGARRISON = 'ungarrison';
Intent.TERMINATOR = 'terminator';
Intent.DECONSTRUCT = 'deconstruct';

module.exports = Intent;
