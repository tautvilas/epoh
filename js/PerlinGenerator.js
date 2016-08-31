'use strict';

var PerlinGenerator = function(seed) {
  this.seed = seed;

  function random2d(x, y) {
    var b = Math.sin(x * 15731 + y * seed) * 1376312589;
    b = Math.cos(b);
    return b - Math.floor(b);
  }

  function interpolate(a, b, x) {
    var ft = x * 3.1415927;
    var f = (1 - Math.cos(ft)) * 0.5;
    return  a*(1-f) + b*f;
  }

  function interpolate2d(x, y, n) {
    var intX = Math.floor(x);
    var fracX = x - intX;
    var intY = Math.floor(y);
    var fracY = y - intY;

    var v1 = random2d(intX, intY);
    var v2 = random2d(intX + 1, intY);
    var v3 = random2d(intX, intY + 1);
    var v4 = random2d(intX + 1, intY + 1);

    var i1 = interpolate(v1, v2, fracX);
    var i2 = interpolate(v3, v4, fracX);

    return interpolate(i1, i2, fracY);
  }

  this.generate = function(x, y) {
    var total = 0;
    var p = 0.25;
    var n = 3;
    for (var i = 0; i < n; i++) {
      var freq = Math.pow(2, i);
      var amp = Math.pow(p, i);
      total += interpolate2d(x * freq, y * freq, n) * amp;
    }
    return total;
  };
};

module.exports = PerlinGenerator;
