'use strict';

var assert = require('assert');
require('./Function');

describe('Function extensions', function() {
  it('should bound memoize', function() {
    var addCalled = 0;
    var substractCalled = 0;
    var add = function(a, b, c) {
      addCalled++;
      return a + b + c;
    };
    var substract = function(a, b, c) {
      substractCalled++;
      return a - b - c;
    };
    assert.equal(add(1, 2, 3), 6);
    assert.equal(add.boundMemoized(undefined, 1, 2, 3), 6);
    assert.equal(addCalled, 2);
    assert.equal(add.boundMemoized(undefined, 1, 2, 3), 6);
    assert.equal(add.boundMemoized(undefined, 1, 2, 3), 6);
    assert.equal(addCalled, 2);

    assert.equal(substract.boundMemoized(undefined, 1, 2, 3), -4);
    assert.equal(substract.boundMemoized(undefined, 1, 2, 3), -4);
    assert.equal(substract.boundMemoized(undefined, 1, 2, 3), -4);
    assert.equal(substractCalled, 1);
  });

  it('should bound memoize object', function() {
    var addCalled = 0;
    var Coords = function(x, y) {
      this.x = x;
      this.y = y;
      this.toString = function() {return x + ' ' + y;};
      this.add = function(a, b) {
        addCalled++;
        return new Coords(this.x + a, this.y + b);
      };
    };

    var c1 = new Coords(10, 20);
    assert.equal(c1+'', '10 20');
    var c2 = c1.add.boundMemoized(c1, 5, 4);
    c2 = c1.add.boundMemoized(c1, 5, 4);
    c2 = c1.add.boundMemoized(c1, 5, 4);
    assert.equal(c2+'', '15 24');
    assert.equal(addCalled, 1);

    var c3 = new Coords(0, 0);
    var c4 = c3.add.boundMemoized(c3, 5, 4);
    c4 = c3.add.boundMemoized(c3, 5, 4);
    c4 = c3.add.boundMemoized(c3, 5, 4);
    assert.equal(c4+'', '5 4');
    assert.equal(addCalled, 2);
  });

  it('should memoize', function() {
    var addCalled = 0;
    var add = function(a, b, c) {
      addCalled++;
      return a + b + c;
    };
    assert.equal(add.memoized(1, 2, 3), 6);
    assert.equal(add.memoized(1, 2, 3), 6);
    assert.equal(addCalled, 1);
  });
});
