'use strict';

require('./Function');
var assert = require('assert');
var CubeCoords = require('./CubeCoords');
var Coords = require('./Coords');

describe('CubeCoordinates', function() {
  it ('should have 6 directions and all coords sum should be 0', function() {
    assert.equal(CubeCoords.directions.length, 6);
    CubeCoords.directions.forEach(function(coord) {
      assert.equal(coord.vector.reduce(function(prev, cur) {return prev + cur;}, 0), 0);
    });
  });

  it('should return neighbour coords for cube coord', function() {
    var c = new CubeCoords(5, -3, 2);
    var neighbours = c.neighbours();
    assert.equal(neighbours.length, 6);
    assert.equal(neighbours[0] + '', '6 -4 2');
    assert.equal(neighbours[1] + '', '6 -3 1');
    assert.equal(neighbours[5] + '', '5 -4 3');
  });

  it('should calculate rings by radius', function() {
    var c = new CubeCoords(0, 0, 0);
    var ring = c.ring(0);
    assert.equal(ring.length, 1);
    assert.equal(ring[0].toString(), '0 0 0');
    ring = c.ring(1);
    assert.equal(ring.length, 6);
    assert.equal(ring[0].toString(), '-1 0 1');
    assert.equal(ring[1].toString(), '0 -1 1');
    assert.equal(ring[2].toString(), '1 -1 0');
    assert.equal(ring[3].toString(), '1 0 -1');
    assert.equal(ring[4].toString(), '0 1 -1');
    assert.equal(ring[5].toString(), '-1 1 0');
    ring = c.ring(2);
    assert.equal(ring.length, 12);
  });

  it('should create cube coords from offset', function() {
    var c = new Coords(1, 1);
    var c2 = CubeCoords.fromOffset(c, true);
    assert.deepEqual(c2.vector, [0, -1, 1]);
    assert.deepEqual(c2.toOffset(true).vector, c.vector);
    var c3 = CubeCoords.fromOffset(c);
    assert.deepEqual(c3.vector, [1, -2, 1]);
    assert.deepEqual(c3.toOffset(false).vector, c.vector);
    c = new Coords(0, 0);
    c2 = CubeCoords.fromOffset(c, true);
    c3 = CubeCoords.fromOffset(c);
    assert.deepEqual(c2.vector, [0, 0, 0]);
    assert.deepEqual(c2.toOffset(true).vector, c.vector);
    assert.deepEqual(c3.vector, [0, 0, 0]);
    assert.deepEqual(c3.toOffset(false).vector, c.vector);
    c = new Coords(-1, -1);
    c2 = CubeCoords.fromOffset(c, true);
    assert.deepEqual(c2.vector, [-1, 2, -1]);
    assert.deepEqual(c2.toOffset(true).vector, c.vector);
    c3 = CubeCoords.fromOffset(c);
    assert.deepEqual(c3.vector, [0, 1, -1]);
    assert.deepEqual(c3.toOffset(false).vector, c.vector);
  });

});

