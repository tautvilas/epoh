'use strict';

require('./String');
require('./Array');
var Tile = require('./Tile');
var CubeCoords = require('./CubeCoords');
var Intent = require('./Intent');
var Unit = require('./Unit');
var Config = require('./Config');
var Cost = require('./Cost');

var Rules = {};

Rules.validateIntent = function(player, intent, src, dest, intents) {
  var intentNum = Object.keys(intents).length;

  if (!Config.PRODUCTION || typeof window === 'undefined') {
    console.log('Validate intent: _ _ _ _'
        .printf(intent, src, dest, intentNum));
  }

  if (!player || !intent || !src || !dest || !intents) return false;

  // do not allow to double-intent

  if (intents[dest.coords]) return false;

  if (dest.name == Tile.WATER || !src.unit ) return false;

  if (!(src.unit.garrison && intent === Intent.UNGARRISON) && src.unit.actions.indexOf(intent) === -1) return false;

  if (!src.unit.multiaction && intentNum !== 0) return false;

  if (src.unit.player !== player.name && !Config.GOD_MODE) return false;

  if (intent === Intent.DECONSTRUCT) {
    if (!dest.unit || [Unit.TYPE_STRUCTURE, Unit.TYPE_MECHANICAL].indexOf(dest.unit.type) === -1 || dest.unit.player !== player.name || dest.unit.garrison) {
      return false;
    }
    cost = Cost.substract({}, Cost.divide(dest.unit.cost, 2));
    if (cost.power) {
      cost.power = cost.power * 2;
    }
    return {
      cost: cost
    };
  } else if (intent === Intent.MOVE) {
    // non garisonable units can not move on empty structures unless its combat
    if (dest.unit && dest.unit.type === Unit.TYPE_STRUCTURE && src.unit && !src.unit.garrisonable && !dest.unit.garrison) return false;
  }

  // distance has to be 1
  var srcCube = CubeCoords.fromOffset(src.coords);
  var destCube = CubeCoords.fromOffset(dest.coords);
  var xcoord = srcCube.substract(destCube).xcoord();
  if (xcoord > 1) {
    return false;
  }

  // evaluate cost
  var unit = Unit.fromName(intent);
  var cost = new Cost();
  if (unit) {
    if (src.unit.actions.indexOf(intent) === -1) return false;
    if ([Intent.MINE, Intent.BIGMINE].contains(intent) && ['undiscovered', undefined].contains(dest.resource)) return false;
    if (intent === Intent.POWERPLANT && !['gas', 'oil', 'coal'].contains(dest.resource)) return false;
    if (dest.field !== player.name && unit.name !== 'teleport') return false;
    if (!Cost.covers(unit.cost, player.resources)) return false;
    cost.add(unit.cost);
  }
  var tileOverlay = Tile.fromName(intent);
  if (tileOverlay) {
    if (!Cost.covers(tileOverlay.cost, player.resources)) return false;
    cost.add(tileOverlay.cost);
  }
  return {
    cost: cost.toData()
  };
};

Rules.calculateNumEngagements = function(tile, tileIntents, dstIntents) {
  if (!tile || !tile.unit) return 0;
  var engagements = [];
  var intent;
  for (var key in dstIntents) {
    intent = dstIntents[key];
    if (intent.player !== tile.unit.player && intent.type === Intent.MOVE) {
      engagements.push(intent.src + '');
    }
  }
  for (key in tileIntents) {
    intent = tileIntents[key];
    if (intent.type === Intent.MOVE && engagements.indexOf(intent.dst + '') === -1) {
      engagements.push(intent.dst + '');
    }
  }
  return engagements.length;
};

Rules.resolveCombat = function(srcTile, destTile, intent, destIntents, engagements) {
  var srcUnit = srcTile.unit;
  var destUnit = destTile.unit;
  if (!Config.PRODUCTION || typeof window === 'undefined') {
    console.log('Resolve intent _ _ _'.printf(srcUnit, destUnit, intent.type));
  }
  if (!srcUnit || !destUnit) return false;

  var garrison;
  if (destUnit.garrison) {
    garrison = destUnit;
    destUnit = destUnit.garrison;
  }

  if (destUnit.type === Unit.TYPE_STRUCTURE) return false;

  var destDefense = (garrison && garrison.defense) ? garrison.defense : destTile.defense;
  var resolution = {
    src: srcUnit,
    dest: destUnit,
    srcCoords: srcTile.coords,
    destCoords: destTile.coords
  };
  if (intent.type === Intent.MOVE) {
    var srcUnitDmg = Math.round(srcUnit.health / srcUnit.maxHealth * srcUnit.damage);
    var dstUnitDmg = Math.round(destUnit.health / destUnit.maxHealth * destUnit.damage / engagements.dst);
    var srcDiff = 0;
    var destDiff = 0;
    if (destUnit.player !== srcUnit.player) {
      var targetMoves = false;
      var targetRunsAway = false;
      var targetAttacksSrc = false;
      for (var srcDestCoords in destIntents) {
        var destIntent = destIntents[srcDestCoords];
        if (destIntent.type === Intent.MOVE) {
          targetMoves = true;
          if (srcDestCoords == srcTile.coords) {
            targetAttacksSrc = true;
          } else if (!destIntent.tile.unit) {
            targetRunsAway = true;
          }
        }
      }
      if (!targetMoves) { // target is fortified and attacks all attackers
        srcDiff = -dstUnitDmg;
      }
      if (targetRunsAway) { // target runs away
        destDiff = -srcUnitDmg / 2;
      } else {
        destDiff = -srcUnitDmg * (1 - destDefense / 100);
      }
    }
    resolution.destDiff = destDiff;
    resolution.srcDiff = srcDiff;
  } else if (intent.type === Intent.BOMBARD) {
    resolution.srcDiff = 0;
    resolution.destDiff = -srcUnit.rangedDmg * (1 - destDefense / 100);
  }
  resolution.destDiff = Math.round(resolution.destDiff);
  resolution.srcDiff = Math.round(resolution.srcDiff);
  resolution.garrison = garrison;
  return resolution;
};

Rules.resolveBuilding = function(srcTile, destTile, intent) {
  var srcUnit = srcTile.unit;
  var destUnit = destTile.unit;
  if (!srcUnit || intent.type === Intent.MOVE) return false;
  var resolution = {src: srcUnit, dest: destUnit};
  var newUnit = Unit.fromName(intent.type);
  if (!newUnit) return false;
  if (destUnit) {
    if (Rules.canBeGarrisoned(newUnit, destUnit)) {
      destUnit.garrison = newUnit;
      resolution.dest = destUnit;
    } else if (Rules.canBeGarrisoned(newUnit, srcUnit)) {
      srcUnit.garrison = newUnit;
    } else {
      return false;
    }
  } else {
    resolution.dest = newUnit;
  }
  newUnit.hue = srcUnit.hue;
  newUnit.player = srcUnit.player;
  /*
  } else {
    var tileOverlay = Tile.fromName(intent.type);
    if (tileOverlay) {
      resolution.destOverlay = tileOverlay.name;
    }
  }
  */
  return resolution;
};

Rules.resolveDeconstruction = function(srcTile, destTile, intent) {
  var srcUnit = srcTile.unit;
  var destUnit = destTile.unit;
  if (!srcUnit || intent.type !== Intent.DECONSTRUCT || !destUnit) return false;
  var resolution = {src: srcUnit, dest: undefined};
  return resolution;
};

Rules.resolveRestacking = function(srcTile, dstTile) {
  var srcUnit = srcTile.unit;
  var dstUnit = dstTile.unit;
  if (srcUnit && dstUnit && srcUnit.player === dstUnit.player && srcUnit.name === dstUnit.name) {
    dstUnit.health += srcUnit.health;
    srcUnit.health = dstUnit.health - dstUnit.maxHealth;
    dstUnit.health = Math.min(dstUnit.health, dstUnit.maxHealth);
    if (srcUnit.health <= 0) {
      srcUnit = undefined;
    }
    return {
      src: srcUnit,
      dest: dstUnit
    };
  }
  return false;
};

Rules.canBeGarrisoned = function(srcUnit, destUnit) {
  if (srcUnit && destUnit && srcUnit.garrisonable && !destUnit.garrison && destUnit.type === Unit.TYPE_STRUCTURE) return true;
  return false;
};

Rules.resolveMovement = function(srcTile, destTile, intent) {
  var srcUnit = srcTile.unit;
  if (srcUnit.garrison) {
    srcUnit = srcUnit.garrison;
  }
  var destUnit = destTile.unit;
  //console.log('Resolve movement _ _ _'.printf(srcUnit, destUnit, intent.type));
  if (!srcUnit || (intent.type !== Intent.MOVE && intent.type !== Intent.UNGARRISON)) return false;
  if (intent.type === Intent.UNGARRISON && !srcTile.unit.garrison) return false;
  var resolution;
  if (Rules.canBeGarrisoned(srcUnit, destUnit)) {
    destUnit.garrison = srcUnit;
    destUnit.player = srcUnit.player;
    resolution = {src: undefined, dest: destUnit};
    return resolution;
  } else if (!destUnit) {
    resolution = {src: srcUnit, dest: destUnit};
    resolution.dest = srcUnit;
    if (srcTile.unit.garrison) {
      resolution.src = srcTile.unit;
      resolution.src.garrison = undefined;
    } else {
      resolution.src = undefined;
    }
    return resolution;
  } else {
    return false;
  }
};

module.exports = Rules;
