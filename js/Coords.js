'use strict';

require('./Function');

var Coords = function(x, y, z) {
  var self = this;

  this.vector = new Array(arguments.length);
  for(var i = 0; i < this.vector.length; ++i) {
    this.vector[i] = arguments[i];
  }

  this.x = x;
  this.y = y;
  this.z = z;

  self.representation = this.vector.join(' ');

  var prototype = Object.getPrototypeOf(self);

  self.add = function(c2) {
    return self.constructor.applyTo(prototype, self.vector.map(function(coord, index) {
      return coord + c2.vector[index];
  }));};

  self.substract = function(c2) {
    return self.constructor.applyTo(prototype, self.vector.map(function(coord, index) {
      return coord - c2.vector[index];
  }));};

  self.uscale = function(s) {
    return self.constructor.applyTo(prototype, self.vector.map(function(coord) {
      return coord * s;
  }));};

  self.scale = function(s) {
    return self.constructor.applyTo(prototype, self.vector.map(function(coord, index) {
      return coord * s.vector[index];
  }));};

  self.floor = function() {
    return self.constructor.applyTo(prototype, self.vector.map(function(coord) {
      return Math.floor(coord);
  }));};

  self.length = function() {
    return Math.sqrt(self.vector.reduce(function(prev, coord) {
      return prev + coord * coord;
  }));};

  self.xcoord = function() {
    return Math.max.apply({}, self.vector.map(function(coord) {
      return Math.abs(coord);
  }));};

  self.toString = function() {
    return self.representation;
  };
};

Coords.fromString = function(str) {
  var c = {};
  Coords.apply(c, str.split(' ').map(function(coord) {
    return parseInt(coord);
  }));
  c.constructor = Coords;
  return c;
};

module.exports = Coords;

