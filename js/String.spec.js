'use strict';

var assert = require('assert');
require('./String');

describe('String extensions', function() {
  it('should printf', function() {
    assert.equal('Example'.printf(), 'Example');
    assert.equal('Hello _!'.printf('John'), 'Hello John!');
    assert.equal('Hello _ _ _!'.printf('John', 'Doe', 30), 'Hello John Doe 30!');
  });
});
