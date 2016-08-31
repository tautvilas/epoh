'use strict';

var Coords = require('./Coords');

var CubeCoords = function(x, y, z) { 
  var self = this;
  Coords.call(self, x, y, z);

  self.neighbours = function() {
    return CubeCoords.directions.map(function(direction) {
      return self.add(direction);
    });
  };

  self.ring = function(radius) {
    if (!radius) {
      return [self];
    }
    var results = [];
    var coord = self.add(CubeCoords.directions[4].uscale(radius));
    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < radius; j++) {
        results.push(coord);
        coord = coord.neighbours()[i];
      }
    }
    return results;
  };

  self.toOffset = function(even) {
    var coords = self;
    var negate = even ? 1 : -1;
    var x = coords.x + (coords.z + negate * (coords.z & 1)) / 2;
    var y = coords.z;
    return new Coords(x, y);
  };
};

CubeCoords.fromOffset = function(coords, even) {
  var negate = even ? 1 : -1;
  var x = coords.x - (coords.y + negate * (coords.y & 1)) / 2;
  var z = coords.y;
  var y = -x - z;
  return new CubeCoords(x, y, z);
};

CubeCoords.directions = [
  new CubeCoords(+1, -1, 0),
  new CubeCoords(+1, 0, -1),
  new CubeCoords(0, +1, -1),
  new CubeCoords(-1, +1, 0),
  new CubeCoords(-1, 0, +1),
  new CubeCoords(0, -1, +1),
];

module.exports = CubeCoords;
