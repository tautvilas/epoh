'use strict';

var assert = require('assert');
var Tile = require('./Tile');
var Intent = require('./Intent');
var Unit = require('./Unit');
var Rules = require('./Rules');
var Coords = require('./Coords');

describe('Rules', function() {

  var MARINE = {
    actions: ['move'],
    cost: {
      iron: 100,
      coal: 60,
      power: 10
    },
    damage: 10,
    health: 20,
    maxHealth: 20,
    name: 'marine',
    range: 2
  };

  describe('Combat', function() {

    it('should reduce damage by terrain defence % for not moving defending unit', function() {
      var src = new Tile(Tile.HILLS);
      var dest = new Tile(Tile.HILLS);
      src.unit = new Unit(MARINE, {player: 'john'});
      dest.unit = new Unit(MARINE, {player: 'peter'});
      var intent = {type: Intent.MOVE};
      var resolution = Rules.resolveCombat(src, dest, intent, {}, {src: 1, dst: 1});
      assert.equal(resolution.srcDiff, -10);
      assert.equal(resolution.destDiff, -8);
    });

    it('should not perform combat on ungarrisoned structures', function() {
      var src = new Tile(Tile.HILLS);
      var dest = new Tile(Tile.HILLS);
      src.unit = new Unit(MARINE, {player: 'john'});
      dest.unit = new Unit(Unit.BASE, {player: 'peter'});
      var intent = {type: Intent.MOVE};
      var resolution = Rules.resolveCombat(src, dest, intent, {}, {src: 1, dst: 1});
      assert.equal(resolution, false);
    });

    it('should perform combat with structure garrison', function() {
      var src = new Tile(Tile.HILLS);
      var dest = new Tile(Tile.HILLS);
      src.unit = new Unit(MARINE, {player: 'john'});
      dest.unit = new Unit(Unit.BASE, {player: 'peter'});
      dest.unit.garrison = new Unit(MARINE, {player: 'peter'});
      var intent = {type: Intent.MOVE};
      var resolution = Rules.resolveCombat(src, dest, intent, {}, {src: 1, dst: 1});
      assert.equal(resolution.srcDiff, -10);
      assert.equal(resolution.destDiff, -5);
      assert.equal(resolution.garrison, dest.unit);
    });

    it('should reduce damage by 50% to fleeing unit', function() {
      var src = new Tile(Tile.HILLS);
      src.coords = new Coords(0, 1);
      var dest = new Tile(Tile.PLAINS);
      dest.coords = new Coords(1, 0);
      src.unit = new Unit(MARINE, {player: 'john'});
      dest.unit = new Unit(MARINE, {player: 'peter'});
      var intent = {type: Intent.MOVE};
      var destIntents = {};
      destIntents[new Coords(1, 1)] = {type: Intent.MOVE, tile: {}};
      var resolution = Rules.resolveCombat(src, dest, intent, destIntents, {src: 1, dst: 1});
      assert.equal(resolution.srcDiff, 0);
      assert.equal(resolution.destDiff, -5);
    });

  });

  describe('Movement', function() {
    it('should move unit if the unit is marine and dest tile is empty', function() {
      var src = new Tile(Tile.PLAINS);
      var dest = new Tile(Tile.PLAINS);
      src.unit = new Unit(MARINE);
      var intent = {type: Intent.MOVE};
      var resolution = Rules.resolveMovement(src, dest, intent);
      assert.deepEqual(resolution, {
        src: undefined,
        dest: new Unit(MARINE)
      });
    });
  });

  describe('Deconstruction', function() {
    it('should not deconstruct if no src or dst unit or intent type incorrect', function() {
      assert.equal(Rules.resolveDeconstruction({}, {}, ''), false);
      assert.equal(Rules.resolveDeconstruction({unit: {}}, {}, {type: 'deconstruct'}), false);
      assert.equal(Rules.resolveDeconstruction({}, {unit: {}}, {type: 'deconstruct'}), false);
    });

    it('should deconstruct if parameters are correct', function() {
      var srcUnit = {};
      assert.deepEqual(Rules.resolveDeconstruction(
          {unit: srcUnit}, {unit: {}}, {type: 'deconstruct'}), {src: srcUnit, dest: undefined});
    });
  });
});
