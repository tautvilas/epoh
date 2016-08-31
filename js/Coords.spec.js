'use strict';

require('./Function');
var assert = require('assert');
var CubeCoords = require('./CubeCoords');
var Coords = require('./Coords');

describe('Coordinates', function() {

  it('should add two cube coordinates', function() {
    var c = (new CubeCoords(1, 2, 3)).add(new Coords(4, 5, -6));
    assert.deepEqual(c.vector, [5, 7, -3]);
  });

  it('should floor coordinate', function() {
    var c = (new Coords(1.7, 2.1, 3.5)).floor();
    assert.deepEqual(c.vector, [1, 2, 3]);
  });

  it('should scale coordinate', function() {
    var c = (new Coords(1.7, 2.1, 3.5)).scale(new Coords(1, 2, 3));
    assert.deepEqual(c.vector, [1.7, 4.2, 10.5]);
  });

  it('should combine operations', function() {
    var c = (new Coords(1.7, 2.1, 3.5)).uscale(2).floor();
    assert.deepEqual(c.vector, [3, 4, 7]);
  });
});

