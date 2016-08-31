'use strict';

var Coords = require('./Coords');
var Config = require('./Config');

var Sector = function(sector) {
  this.value = sector === '0' ? sector : sector.replace(/^[0]+/g, '');
  this.position = getPosition(sector);

  function getPosition(s) {
    var length = sector.length;
    var xpos = 0;
    var ypos = 0;
    var halfx = Math.floor(Sector.MAP[0].length / 2);
    var halfy = Math.floor(Sector.MAP.length / 2);
    for (var i = 0; i < length; i++) {
      var c = s.charAt(i);
      xpos += (Sector.LOC[c][1] - halfx) * Math.pow(5, length - i - 1);
      ypos += (Sector.LOC[c][0] - halfy) * Math.pow(5, length - i - 1);
    }
    return new Coords(xpos, ypos);
  }

  this.up = function() {
    return Sector.fromCoords(this.position.x, this.position.y - 1);
  };

  this.down = function() {
    return Sector.fromCoords(this.position.x, this.position.y + 1);
  };

  this.left = function() {
    return Sector.fromCoords(this.position.x - 1, this.position.y);
  };

  this.right = function() {
    return Sector.fromCoords(this.position.x + 1, this.position.y);
  };

  this.next = function() {
    function nextChar(c) {
      var cLength = Sector.CHARS.length;
      var position = Sector.CHARS.indexOf(c);
      if (position != cLength - 1) {
        return Sector.CHARS[++position];
      } else {
        return false;
      }
    }
    var val = '0' + this.value;
    for (var i = val.length - 1; i >= 0; i--) {
      var n = nextChar(val.charAt(i));
      if (n) {
        var s = val.substr(0, i) + n + val.substr(i+1, val.length).replace(/./g, '0');
        return new Sector(s);
      }
    }
  };

  this.toString = function() {
    return this.value;
  };
};

Sector.fromTileCoords = function(val) {
  var sectorCoords = new Coords(Math.floor(val.x / Config.SECTOR_WIDTH), Math.floor(val.y / Config.SECTOR_HEIGHT));
  var sector = Sector.fromCoords(sectorCoords.x, sectorCoords.y);
  return sector;
};

Sector.fromCoords = function(x, y) {
  function pcoord(l, pow, len) {
    var power = Math.pow(len, pow);
    var cx = Math.round(l / power);
    return cx;
  }
  function coord(l, len) {
    var pow = -1;
    var crd = 3;
    do {
      crd = pcoord(l, ++pow, len);
    } while(Math.abs(crd) > Math.floor(len / 2));
    return pow;
  }

  var sector = '';
  var lenx = Sector.MAP[0].length;
  var leny = Sector.MAP.length;
  var lx = x;
  var ly = y;
  var maxpow = Math.max(coord(lx, lenx), coord(ly, leny));
  do {
    var xx = pcoord(lx, maxpow, lenx);
    var yy = pcoord(ly, maxpow, leny);
    sector += Sector.MAP[yy + Math.floor(leny / 2)][xx + Math.floor(lenx / 2)];
    lx -= xx * Math.pow(lenx, maxpow);
    ly -= yy * Math.pow(leny, maxpow);
    maxpow--;
  } while(maxpow >= 0);

  return new Sector(sector);
};

Sector.MAP = [
  ['Y', 'I', 'J', 'K', 'L'],
  ['X', 'H', 'A', 'B', 'M'],
  ['W', 'G', '0', 'C', 'N'],
  ['V', 'F', 'E', 'D', 'O'],
  ['U', 'T', 'S', 'R', 'P']
];

Sector.CHARS = '0ABCDEFGHIJKLMNOPRSTUVWXY';

(function() {
  Sector.LOC = {};
  for (var y = 0; y < Sector.MAP.length; y++) {
    for (var x = 0; x < Sector.MAP[y].length; x++) {
      Sector.LOC[Sector.MAP[y][x]] = [y, x];
    }
  }
})();

module.exports = Sector;
module.exports.Coords = Coords;
