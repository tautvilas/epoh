'use strict';

var assert = require('assert');
var Sector = require('./Sector');

describe('Sector', function() {
  it('should costruct sector from coords', function() {
    assert.equal(Sector.fromCoords(13, 0).value, 'CWW');
    assert.equal(Sector.fromCoords(0, 0).value, '0');
    assert.equal(Sector.fromCoords(12, 0).value, 'NN');
    assert.equal(Sector.fromCoords(25, 0).value, 'C00');
    assert.equal(Sector.fromCoords(-3, -5).value, 'HN');
    assert.equal(Sector.fromCoords(3, 12).value, 'RU');
    assert.equal(Sector.fromCoords(-5, 5).value, 'F0');
    assert.equal(Sector.fromCoords(-625, -625).value, 'H0000');
    assert.equal(Sector.fromCoords(-1758907, -1748317).value, 'HELLOKITTY');
    assert.equal(Sector.fromCoords(-77244, 386).value, 'G00DL0RD');
  });

  it('should return sector coords', function() {
    assert.equal((new Sector('CWW')).position+'', '13 0');
    assert.equal((new Sector('RU').position)+'', '3 12');
    assert.equal((new Sector('0')).position+'', '0 0');
    assert.equal((new Sector('HN')).position+'', '-3 -5');
    assert.equal((new Sector('HELLOKITTY')).position+'', '-1758907 -1748317');
    assert.equal((new Sector('G00DL0RD')).position+'', '-77244 386');
  });

  it('should find sector that is right of current sector', function() {
    var sector = new Sector('0');
    var values = ['C', 'N', 'CW', 'CG', 'C0', 'CC', 'CN', 'NW', 'NG', 'N0', 'NC', 'NN', 'CWW'];
    values.forEach(function(val) {
      sector = sector.right();
      assert.equal(sector.value, val);
    });
    sector = new Sector('AL');
    values = ['BY', 'BI', 'BJ', 'BK', 'BL', 'MY', 'MI', 'MJ', 'MK', 'ML', 'CXY'];
    values.forEach(function(val) {
      sector = sector.right();
      assert.equal(sector.value, val);
    });
    sector = new Sector('GN');
    values = ['W', 'G', '0', 'C'];
    values.forEach(function(val) {
      sector = sector.right();

      assert.equal(sector.value, val);
    });
    sector = new Sector('HN');
    values = ['AW', 'AG', 'A0'];
    values.forEach(function(val) {
      sector = sector.right();
      assert.equal(sector.value, val);
    });
    sector = new Sector('GNN');
    assert.equal(sector.right().value, 'WW');
    sector = new Sector('XMM');
    assert.equal(sector.right().value, 'HXX');
  });

  it('should know neighbour sectors', function() {
    assert.equal((new Sector('HN')).position+'', '-3 -5');
    assert.equal((new Sector('HN').right()).position+'', '-2 -5');
    assert.equal((new Sector('HN').left()).position+'', '-4 -5');
    assert.equal((new Sector('HN').up()).position+'', '-3 -6');
    assert.equal((new Sector('HN').down()).position+'', '-3 -4');
  });

  it('should return next sector', function() {
    assert.equal((new Sector('0')).next().value, 'A');
    assert.equal((new Sector('0')).next().next().next().value, 'C');
    assert.equal((new Sector('Y')).next().value, 'A0');
    assert.equal((new Sector('Y')).next().next().value, 'AA');
    assert.equal((new Sector('ABY')).next().value, 'AC0');
  });

  it('should trim prepending zeroes', function() {
    assert.equal((new Sector('0')).value, '0');
    assert.equal((new Sector('0ABB')).value, 'ABB');
    assert.equal((new Sector('00A0B0B0')).value, 'A0B0B0');
  });

});

