'use strict';

var Config = require('./Config');
var Coords = require('./Coords');
var Cost = require('./Cost');
var CubeCoords = require('./CubeCoords');
var Intent = require('./Intent');
var Map = require('./Map');
var Rules = require('./Rules');
var Sector = require('./Sector');
var Stream = require('./Stream');
var Tile = require('./Tile');
var Unit = require('./Unit');

var Game = function(map) {
  var self = this;
  this.map = map;
  this.tick = 0;
  this.unitCount = 0;
  this.players = {};
  this.intents = {};
  this.topScores = [];
  this.events = new Stream();
  var turnTime = Config.TICK_LENGTH;
  var tickStart = (new Date()).getTime();
  var gameStart = (new Date()).getTime();

  this.getMatchTime = function() {
    return Math.round((Config.ROUND_LENGTH - ((new Date()).getTime() - gameStart)));
  };

  this.getStatus = function(name, type) {
    var now = (new Date()).getTime();
    var time = Math.round((turnTime - (now - tickStart)));
    return {
      type: type,
      tick: self.tick,
      time: time,
      matchTime: self.getMatchTime(),
      player: self.players[name],
      scores: self.topScores.sort(function(s1, s2) {return s2.score - s1.score;})
        .filter(function(s, i) {return i < 5;})
    };
  };

  function endTurn() {
    self.events.push(self.getStatus(undefined, 'resolution'));

    var combatResolutions = self.resolveIntents(Rules.resolveCombat);
    self.resolveUnitsHealth(combatResolutions);
    self.resolveIntents(Rules.resolveDeconstruction);
    var numResolutions;
    do {
      numResolutions = self.resolveIntents(Rules.resolveMovement, true).length;
    } while(numResolutions);
    self.resolveIntents(Rules.resolveRestacking, true);
    self.resolveIntents(Rules.resolveBuilding);
    self.resolveTeleports();
    self.linkTeleports();

    self.map.resetTilePropsCache();
    self.map.calculateProps(self.map.units);
    self.countResources();
    self.calculateTopScores();
    self.intents = {};
    self.tick++;
    tickStart = (new Date()).getTime();
    var matchTime = self.getMatchTime();
    if (matchTime > 0) {
      self.events.push(self.getStatus(undefined, 'orders'));
    } else {
      self.events.push(self.getStatus(undefined, 'end'));
    }
  }

  var turnInterval = setInterval(function() {
    endTurn();
  }, turnTime);

  this.getSector = function(s, player) {
    return this.map.getSector(s, player);
  };

  this.linkTeleports = function() {
    var unlinkedTeleports = {};
    var player;
    for (var src in this.map.units) {
      var unit = this.map.units[src];
      player = unit.player;
      if (unit.name === 'teleport' && !unit.target) {
        if (!unlinkedTeleports[player]) {
          unlinkedTeleports[player] = [];
        }
        unlinkedTeleports[player].push({port: unit, coords: src});
      }
    }

    for (player in unlinkedTeleports) {
      var teleports = unlinkedTeleports[player];
      for (var i = 0; i < teleports.length - 1; i++) {
        teleports[i].port.target = teleports[i + 1].coords;
        teleports[i + 1].port.target = teleports[i].coords;
      }
    }
  };

  this.resolveTeleports = function() {
    var units = this.map.units;
    var teleported = {};
    for (var src in units) {
      var unit = units[src];
      if (unit.name === 'teleport') {
        var target = units[unit.target];
        if (unit.garrison && target && !target.garrison && !teleported[src]) {
          target.garrison = unit.garrison;
          target.player = unit.garrison.player;
          teleported[unit.target] = true;
          delete unit.garrison;
        }
      }
    }
  };

  this.countResources = function() {
    var units = this.map.units;
    for (var player in this.players) {
      this.players[player].units = 0;
      this.players[player].score = 0;
      this.players[player].income = {
        iron: 0,
        gas: 0,
        copper: 0,
        coal: 0,
        gold: 0,
        oil: 0
      };
      this.players[player].caps = {};
    }
    var unit;
    for (var src in units) {
      unit = units[src];
      player = unit.player;
      if (unit.name === Unit.BASE.name) {
        this.players[player].resources.iron += Config.BASE_MONEY;
        this.players[player].resources.power = Config.STARTING_POWER;
        this.players[player].income.iron += Config.BASE_MONEY;
        this.players[player].score += 20;
      } else if (unit.name === Unit.MINE.name || unit.name === Unit.BIGMINE.name) {
        this.players[player].score += 20;
        var tile = this.map.getFullTile(src);
        var additionalResource = {};
        additionalResource[tile.resource] = Config.MINE_MONEY;
        this.players[player].resources = Cost.add(this.players[player].resources, additionalResource);
        this.players[player].resources.power -= unit.cost.power || 0;
        this.players[player].income[tile.resource] += Config.MINE_MONEY;
        this.players[player].caps[tile.resource] = this.players[player].caps[tile.resource] || 200;
        if (unit.name === Intent.BIGMINE) {
          this.players[player].caps[tile.resource] += 100;
        }
      } else if (unit.name === Intent.POWERPLANT) {
        this.players[player].resources.power += 60;
        this.players[player].score += 10;
      } else {
        this.players[player].resources.power -= unit.cost.power || 0;
        this.players[player].score += 10;
      }
      if (unit.garrison) {
        this.players[unit.garrison.player].resources.power -= unit.garrison.cost.power || 0;
        this.players[unit.garrison.player].score += 10;
      }
      this.players[player].units++;
    }
    for (var key in this.players) {
      var playero = this.players[key];
      playero.resources = Object.keys(playero.resources).reduce(function(acc, res) {
        playero.caps[res] = playero.caps[res] || 200;
        acc[res] = Math.min(playero.resources[res], playero.caps[res]);
        return acc;
      }, {});
    }
    // calculate field score
    var fieldsAdded = {};
    for (src in units) {
      unit = units[src];
      if (unit.field) {
        var cc = CubeCoords.fromOffset(Coords.fromString(src));
        for (var i = 0; i <= unit.field; i++) {
          var ccs = cc.ring(i);
          ccs.forEach(function(cc) {
            var cco = cc.toOffset();
            if (!fieldsAdded[cco]) {
              var props = self.map.getTileProps(cco);
              if (props.field) {
                self.players[props.field].score += 1;
              }
              fieldsAdded[cco] = true;
            }
          }, 0);
        }
      }
    }
    for (player in this.players) {
      this.players[player].score = Math.round(this.players[player].score);
    }
  };

  this.calculateTopScores = function() {
    var values = [];
    for (var player in this.players) {
      values.push(this.players[player]);
    }
    this.topScores = values.map(function(p) {
      return {
        name: p.name,
        score: p.score
      };
    });
    this.topScores.sort(function(a, b) {return a.score - b.score;});
  };

  this.iterateIntents = function(callback) {
    for (var coords in this.intents) {
      var intents = this.intents[coords];
      for (var src in intents) {
        var intent = intents[src];
        var srcTile = self.map.getFullTile(intent.src);
        var dstTile = self.map.getFullTile(intent.dst);
        callback.bind(this)(intent, srcTile, dstTile);
      }
    }
  };

  function getTileIntents(coords) {
    var ccs = CubeCoords.fromOffset(coords).neighbours();
    return ccs.reduce(function(intents, cc) {
      var offset = cc.toOffset();
      if (self.intents[offset] && self.intents[offset][coords]) {
        intents[offset] = self.intents[offset][coords];
        intents[offset].tile = self.map.getFullTile(offset);
      }
      return intents;
    }, {});
  }

  this.resolveUnitsHealth = function(combatResolutions) {
    combatResolutions.forEach(function(resolution) {
      if (resolution.srcDiff) {
        resolution.src.health += resolution.srcDiff;
      }
      if (resolution.destDiff) {
        (resolution.dest.garrison || resolution.dest).health += resolution.destDiff;
      }
    });
    var units = this.map.units;
    for (var coords in units) {
      var unit = units[coords].garrison || units[coords];
      var tile = this.map.getFullTile(coords);
      unit.disabled = false;
      if (self.isPlayerDisabled(unit.player) && !unit.mock) {
        unit.health -= Config.DISABLED_DAMAGE;
        unit.disabled = true;
      } else if (tile.field !== unit.player) {
        unit.health -= Config.FIELD_DAMAGE;
        logHealthChange(tile, -Config.FIELD_DAMAGE);
      }
      if (unit.health <= 0) {
        addLogMessage(unit.player, '_ @(_) died'.printf(unit.name, coords), Coords.fromString(coords));
        this.removeUnitWithIntents(coords);
      }
    }
  };

  this.removeUnitWithIntents = function(coords) {
    if (this.map.units[coords] && this.map.units[coords].garrison) {
      delete this.map.units[coords].garrison; //TODO: remove ungarrison intent
    } else {
      for (var dst in this.intents) {
        //TODO: maybe check if intent exists and compesate the cost
        delete this.intents[dst][coords];
      }
      delete this.map.units[coords];
    }
  };

  function resolveUnit(resolution, coords) {
    if (resolution) {
      if (!resolution.id) {
        resolution.id = self.unitCount++;
      }
      self.map.units[coords] = resolution;
    } else {
      self.removeUnitWithIntents(coords);
    }
  }

  this.resolveIntents = function(step, deleteResolvedIntent) {
    var resolutions = [];
    this.iterateIntents(function(intent, srcTile, dstTile) {
      var src = srcTile.coords;
      var coords = dstTile.coords;
      var destIntents = getTileIntents(dstTile.coords);
      var engagements = {
        src: Rules.calculateNumEngagements(srcTile, getTileIntents(src), self.intents[src]),
        dst: Rules.calculateNumEngagements(dstTile, destIntents, self.intents[coords])
      };
      var resolution = step(srcTile, dstTile, intent, destIntents, engagements);
      if (!resolution && srcTile.unit && step === Rules.resolveBuilding) {
        self.players[srcTile.unit.player].resources = Cost.add(self.players[srcTile.unit.player].resources, intent.cost);
        return;
      }
      if (resolution) {
        logHealthChange(srcTile, resolution.srcDiff);
        logHealthChange(dstTile, resolution.destDiff);
        resolutions.push(resolution);
        resolveUnit(resolution.src, src);
        resolveUnit(resolution.garrison || resolution.dest, coords);
        /*
        if (resolution.destOverlay) {
          self.map.overlays[coords] = resolution.destOverlay;
        }
        */
        if (deleteResolvedIntent) {
          delete self.intents[coords][src];
        }
      }
    });
    return resolutions;
  };

  this.cancelIntents = function(name, c) {
    var coords = Coords.fromString(c);
    var tile = self.map.getFullTile(coords);
    if (!tile.unit) return false;
    CubeCoords.fromOffset(coords).neighbours().forEach(function(cc) {
      var oc = cc.toOffset();
      if (self.intents[oc] && self.intents[oc][coords]) {
        self.players[name].resources = Cost.add(self.players[name].resources, self.intents[oc][coords].cost);
        delete self.intents[oc][coords];
      }
    });
    return 'OK';
  };

  this.addIntent = function(name, intent) {
    if (!this.intents[intent.dst]) {
      this.intents[intent.dst] = {};
    }
    var src = self.map.getFullTile(intent.src);
    var tile = self.map.getFullTile(intent.dst);
    var ccn = CubeCoords.fromOffset(intent.src).neighbours();
    var unitIntents = ccn.reduce(function(acc, val) {
      var tents = self.intents[val.toOffset()];
      if (tents) {
        var tent = tents[src.coords];
        if (tent) {
          acc[val.toOffset()] = tent;
        }
      }
      return acc;
    }, {});
    var validatedIntent = Rules.validateIntent(self.players[name], intent.type, src, tile, unitIntents);
    if (!validatedIntent) {
      return false;
    }
    self.players[name].resources = Cost.substract(self.players[name].resources, validatedIntent.cost);
    self.players[name].seenAt = self.tick;
    intent.cost = validatedIntent.cost;
    intent.player = src.unit.player;
    this.intents[intent.dst][intent.src] = intent;
    return validatedIntent;
  };

  this.placePlayer = function(sector) {
    var position = false;
    var start = this.map.getTileCoords(sector, Math.floor(Map.SECTOR_WIDTH / 2), Math.floor(Map.SECTOR_HEIGHT / 2));
    var cube = CubeCoords.fromOffset(start);
    var ring = 0;
    var outside = true; // all of ring is outside sector
    var sectorHasUnits = false; // at least one other unit in sector

    do {
      outside = true;
      cube.ring(ring).forEach(function(coord) {
        var ocord = coord.toOffset();
        if (!Map.coordsInSector(ocord.substract(
              new Coords(sector.position.x * Map.SECTOR_WIDTH,
                         sector.position.y * Map.SECTOR_HEIGHT)))) {
          return;
        }
        outside = false;
        var tile = self.map.getFullTile(ocord);
        if (tile.unit && !tile.unit.mock) sectorHasUnits = true;
        else if (tile.name != Tile.WATER && !tile.resource && !position) {
          position = ocord;
        }
      });
      ring++;
    } while(!outside && !sectorHasUnits);

    if (!sectorHasUnits && position) {
      return position;
    } else {
      return false;
    }
  };

  function addLogMessage(player, msg, coords) {
    self.players[player].log.push({
      time: (new Date()).getTime(),
      message: msg,
      tick: self.tick,
      coords: coords
    });
  }

  function logHealthChange(tile, diff) {
    if(tile && tile.unit && diff) {
      var unit = tile.unit.garrison || tile.unit;
      addLogMessage(unit.player, '_ @(_) _'.printf(unit.name, tile.coords, diff), tile.coords);
    }
  }

  this.addPlayer = function(name, sect, mock) {
    if (this.players[name]) {
      return false;
    }
    var sector = new Sector(sect || '0');
    var position = false;
    while(!position) {
      position = this.placePlayer(sector);
      if (position) {
        break;
      }
      sector = sector.next();
    }
    var player = {
      sector: sector,
      base: position,
      resources: {
        power: Config.STARTING_POWER - 10,
        iron: Config.STARTING_MONEY
      },
      income: {
        iron: Config.BASE_MONEY
      },
      caps: {
        iron: 200
      },
      name: name,
      units: 1,
      hue: Math.floor(Math.random() * 36) * 10,
      log: [],
      mock: mock,
      seenAt: self.tick
    };

    var unit = Unit.fromPrototype(Unit.BASE, {
      player: name,
      hue: player.hue,
      id: self.unitCount++
    });
    unit.garrison = Unit.fromPrototype(Unit.WORKER, {
      player: name,
      hue: player.hue,
      id: self.unitCount++
    });
    this.map.units[position] = unit;
    var units = {};
    units[position] = unit;

    self.map.calculateProps(units);

    this.players[name] = player;
    if (Config.MOCK_UNITS) {
      Config.MOCK_UNITS.filter(function(unit) {
        return unit.player === name;
      }).forEach(function(unit) {
        self.map.units[unit.coords] = Unit.fromName(unit.name, unit);
        self.map.units[unit.coords].mock = true;
        self.map.units[unit.coords].hue = player.hue;
        self.map.units[unit.coords].id = self.unitCount++;
      });
      self.map.calculateProps(self.map.units);
    }
    addLogMessage(name, '_ joined'.printf(name), player.base);
    return player;
  };

  this.getPlayer = function(name) {
    return this.players[name];
  };

  this.isPlayerDisabled = function(name) {
    var player = self.players[name];
    if (!player.units || (player.seenAt < self.tick - Config.DISABLE_TIMEOUT) || player.mock) {
      return true;
    }
    return false;
  };

  this.endTurn = function(name) {
    this.players[name].seenAt = this.tick;
    this.players[name].endedTurn = true;
    for (var player in this.players) {
      var pl = this.players[player];
      if (!pl.endedTurn && !self.isPlayerDisabled(player)) {
        return "WAIT";
      }
    }
    for (player in this.players) {
      this.players[player].endedTurn = false;
    }
    endTurn();
    clearInterval(turnInterval);
    turnInterval = setInterval(function() {
      endTurn();
    }, turnTime);
    return 'OK';
  };

  if (Config.MOCK_PLAYERS) {
    Config.MOCK_PLAYERS.forEach(function(player) {
      self.addPlayer(player.name, player.sector, true);
    });
  }
};

module.exports = Game;
