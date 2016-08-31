'use strict';

var PerlinGenerator = require('./PerlinGenerator');
var Sector = require('./Sector');
var Coords = require('./Coords');
var CubeCoords = require('./CubeCoords');
var Tile = require('./Tile');
var Config = require('./Config');
var Unit = require('./Unit');

var Map = function(seed) {
  var self = this;
  this.seed = seed;
  this.generator = new PerlinGenerator(seed);
  this.units = {};
  this.sectorCache = {};
  this.tilePropsCache = {};
  this.dynamicTilePropsCache = {};
  this.tileCache = {};
  //this.overlays = {};
  this.resourceProbabilities = [
    {name: 'iron', prob: 40},
    {name: 'copper', prob: 60},
    {name: 'coal', prob: 80},
    //{name: 'gold', prob: 80},
    {name: 'oil', prob: 90},
    {name: 'gas', prob: 100}
  ];

  var getTile = function(x, y) {
    var c = new Coords(x, y);
    var val0 = self.generator.generate(x / 3, y / 3);
    var val1 = Math.floor(val0 * 3) * 200;
    var tile;
    c = new Coords(x, y);
    switch(val1) {
      case 0: tile = new Tile(Tile.WATER, c); break;
      case 200: tile = new Tile(Tile.PLAINS, c); break;
      case 400: tile = new Tile(Tile.HILLS, c); break;
      default: tile = new Tile(Tile.MOUNTAINS, c); break;
    }
    return tile;
  };

  var generateSector = function(s) {
    var sector = new Sector(s);
    var position = sector.position;
    var posX = position.x * Map.SECTOR_WIDTH;
    var posY = position.y * Map.SECTOR_HEIGHT;
    if (!self.sectorCache[sector]) {
      //console.log('generate sector _'.printf(s));
      var sectorTiles = [];
      for (var y = posY; y < posY + Map.SECTOR_HEIGHT; y++) {
        for (var x = posX; x < posX + Map.SECTOR_WIDTH; x++) {
          var t = getTile(x, y);
          t.sector = sector;
          sectorTiles.push(t);
        }
      }
      // add resources
      var resourcesAdded = 0;
      for (var i = 0; i < 1000; i++) {
        var j = Math.floor(Math.random() * sectorTiles.length);
        var tile = sectorTiles[j];
        if (!tile.resource && tile.name != Tile.WATER) {
          var resourceProb = Math.floor(Math.random() * 100);
          for (var z = 0; z < self.resourceProbabilities.length; z++) {
            if (resourceProb < self.resourceProbabilities[z].prob) {
              sectorTiles[j].resource = self.resourceProbabilities[z].name;
              resourcesAdded++;
              break;
            }
          }
          if (resourcesAdded >= Config.RESOURCES_PER_SECTOR) {
            break;
          }
        }
      }
      self.sectorCache[sector] = sectorTiles;
    }
    return self.sectorCache[sector];
  };

  this.resetTilePropsCache = function() {
    self.tilePropsCache = {};
  };

  this.getFullTile = function(tc, player) {
    var sector;
    if (!tc.substract) {
      tc = Coords.fromString(tc);
    }
    // cache sector name for tile because it is complex calculation
    if (self.tileCache[tc]) {
      sector = self.tileCache[tc];
    } else {
      sector = Sector.fromTileCoords(tc);
      self.tileCache[tc] = sector;
    }

    var sectorTiles = generateSector(sector.value);
    var c = tc.substract(sector.position.scale(new Coords(Config.SECTOR_WIDTH, Config.SECTOR_HEIGHT)));

    var base = sectorTiles[c.y * Config.SECTOR_WIDTH + c.x];
    var unit = self.units[tc];
    var newTile = new Tile(base);
    var tileProps = self.getTileProps(tc, player);
    newTile.sector = sector;
    newTile.resource = tileProps.discovered || !player ? base.resource : tileProps.visible ? 'undiscovered' : undefined;
    newTile.field = tileProps.field;
    newTile.visible = tileProps.visible;
    //newTile.overlay = tileProps.overlay;
    newTile.unit = unit;
    return newTile;
  };

  this.getTileCoords = function(sector, x, y) {
    var position = sector.position;
    var posX = position.x * Map.SECTOR_WIDTH;
    var posY = position.y * Map.SECTOR_HEIGHT;
    return new Coords(x, y).add(new Coords(posX, posY));
  };

  function accessTileProps(coords, player, useCache) {
    var cache = useCache || self.tilePropsCache;
    var tileProps = cache[coords];
    if (!tileProps) {
      tileProps = {};
      cache[coords] = tileProps;
    }
    if (!tileProps[player]) {
      tileProps[player] = {};
    }
    return tileProps;
  }

  this.calculateProps = function(units) {
    Object.keys(units).forEach(function(key) {
      var unit = self.units[key];
      var ufield = unit.field || 0;
      var urange = unit.range || 0;
      var player = unit.player;
      var maxRing = Math.max(ufield, urange);
      var unitCoords = Coords.fromString(key);
      var unitCubeCoords = CubeCoords.fromOffset(unitCoords);

      if (unit.name === Unit.WORKER.name) {
        var tileProps = accessTileProps(key, player, self.dynamicTilePropsCache);
        tileProps[player].discovered = true;
      }

      for (var i = 0; i <= maxRing; i++) {
        var ring = unitCubeCoords.ring(i);
        ring.forEach(function(tileCoord) {
          var tileOffsetCoords = tileCoord.toOffset();
          var props = accessTileProps(tileOffsetCoords, player);
          if (i <= urange) {
            props[player].visible = true;
          }
          if (i <= ufield && unit.field && !unit.disabled) {
            if (!props.field || props.field.range > i) {
              props.field = {
                player: player,
                range: i
              };
            } else if (props.field.range === i && props.field.player !== player) {
              props.field.player = undefined;
            }
          }
        });
      }
    });
  };

  this.getTileProps = function(coords, player) {
    var props = self.tilePropsCache[coords];
    var dynamicProps = accessTileProps(coords, player, self.dynamicTilePropsCache);
    var field = props && props.field ? props.field.player : undefined;
    var visible = props && props[player] ? props[player].visible : false;
    var discovered = dynamicProps[player].discovered;
    //var overlay = self.overlays[coords];

    return {
      field: field,
      visible: visible,
      //overlay: overlay,
      discovered: discovered
    };
  };

  this.getSector = function(sector, player) {
    var tiles = generateSector(sector);
    // add fog of war
    return tiles.map(function(tile) {
      var newTile = self.getFullTile(tile.coords, player);
      if (!newTile.visible && Config.SHROUD) {
        newTile.name = Tile.SHROUD.name;
        delete newTile.unit;
        delete newTile.field;
      }
      return newTile;
    });
  };
};

Map.coordsInSector = function(coords) {
  if (coords.x < 0 || coords.y < 0) return false;
  if (coords.x >= Map.SECTOR_WIDTH || coords.y >= Map.SECTOR_HEIGHT) return false;
  return true;
};

Map.SECTOR_WIDTH = Config.SECTOR_WIDTH;
Map.SECTOR_HEIGHT = Config.SECTOR_HEIGHT;

module.exports = Map;
