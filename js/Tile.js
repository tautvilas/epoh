'use strict';

var Coords = require('./Coords');
var Unit = require('./Unit');

var Tile = function(proto, coords) {
  for (var key in proto) {
    this[key] = proto[key];
  }
  if (!this.intents) {
    this.intents = {};
  }
  if (coords) {
    this.coords = coords;
  } else if (proto.coords) {
    this.coords = new Coords(proto.coords.x, proto.coords.y);
  }

  this.toString = function() {
    return this.name;
  };
};

Tile.fromJson = function(json) {
  if (json.unit) {
    json.unit = Unit.fromPrototype(json.unit);
  }
  return new Tile(json);
};

Tile.WIDTH = 90;
Tile.HEIGHT = 104;

Tile.WATER = new Tile({
  name: 'water',
  defense: 0
});
Tile.PLAINS = new Tile({
  name: 'plains',
  defense: 0
});
Tile.HILLS = new Tile({
  name: 'hills',
  defense: 20
});
Tile.MOUNTAINS = new Tile({
  name: 'mountains',
  defense: 40
});
Tile.SHROUD = new Tile({
  name: 'shroud',
  defense: 0
});
Tile.GRASS = new Tile({
  name: 'grass',
  defense: 0,
  cost: {
    iron: 100
  }
});

Tile.fromName = function(name) {
  for (var key in Tile) {
    var tile = Tile[key];
    if (tile.name && tile.name === name) {
      return new Tile(tile);
    }
  }
};

module.exports = Tile;
