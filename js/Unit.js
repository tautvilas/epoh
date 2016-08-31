'use strict';

var Intent = require('./Intent');

var Unit = function(proto, proto2) {
  for (var key in proto) {
    this[key] = proto[key];
  }
  if (proto2) {
    for (key in proto2) {
      this[key] = proto2[key];
    }
  }
};

Unit.prototype.toString = function() {
  return this.name;
};

Unit.TYPE_STRUCTURE = 'structure';
Unit.TYPE_MECHANICAL = 'mechanical';

Unit.BASE = {
  actions: ['rover', 'worker', 'marine', Intent.TERMINATOR, Intent.BOMBARD],
  cost: {
    iron: 500
  },
  damage: 0,
  defense: 50,
  field: 2,
  health: 100,
  maxHealth: 100,
  multiaction: true,
  name: 'base',
  range: 3,
  rangedDmg: 5,
  type: Unit.TYPE_STRUCTURE
};
Unit.ROVER = {
  actions: [Intent.MOVE],
  cost: {
    iron: 100,
    power: 10
  },
  damage: 10,
  health: 15,
  maxHealth: 15,
  name: 'rover',
  range: 2,
  type: Unit.TYPE_MECHANICAL
};
Unit.MARINE = {
  actions: [Intent.MOVE],
  cost: {
    iron: 100,
    coal: 60,
    power: 10
  },
  damage: 15,
  health: 20,
  maxHealth: 20,
  name: 'marine',
  garrisonable: true,
  range: 2
};
Unit[Intent.TERMINATOR] = {
  actions: [Intent.MOVE],
  cost: {
    iron: 300,
    coal: 100,
    oil: 100,
    copper: 50,
    power: 30
  },
  damage: 30,
  health: 30,
  maxHealth: 50,
  name: Intent.TERMINATOR,
  garrisonable: true,
  range: 3
};
Unit.WORKER = {
  actions: [Intent.MOVE, Intent.DECONSTRUCT, 'amplifier', 'mine', 'bigmine', Intent.POWERPLANT, 'teleport'],
  cost: {
    iron: 100,
    power: 10
  },
  damage: 5,
  health: 10,
  maxHealth: 10,
  name: 'worker',
  garrisonable: true,
  range: 2,
  type: Unit.TYPE_MECHANICAL
};

Unit.AMPLIFIER = {
  actions: [],
  cost: {
    iron: 50,
    power: 20
  },
  damage: 0,
  defense: 40,
  field: 2,
  health: 15,
  maxHealth: 15,
  name: 'amplifier',
  range: 3,
  type: Unit.TYPE_STRUCTURE
};

Unit.TELEPORT = {
  actions: [],
  cost: {
    power: 10
  },
  damage: 0,
  defense: 20,
  health: 1,
  maxHealth: 1,
  name: 'teleport',
  range: 1,
  type: Unit.TYPE_STRUCTURE
};

Unit.MINE = {
  actions: [],
  cost: {
    iron: 150,
    power: 20
  },
  damage: 0,
  defense: 50,
  health: 50,
  maxHealth: 50,
  name: 'mine',
  range: 2,
  type: Unit.TYPE_STRUCTURE
};

Unit.BIGMINE = {
  actions: [],
  cost: {
    iron: 200,
    power: 20
  },
  damage: 0,
  health: 50,
  defense: 50,
  maxHealth: 50,
  name: 'bigmine',
  range: 2,
  type: Unit.TYPE_STRUCTURE
};

Unit.POWERPLANT = {
  actions: [],
  cost: {
    iron: 200
  },
  damage: 0,
  health: 50,
  defense: 20,
  maxHealth: 50,
  name: Intent.POWERPLANT,
  range: 2,
  type: Unit.TYPE_STRUCTURE
};

Unit.fromPrototype = function(proto1, proto2) {
  return new Unit(proto1, proto2);
};

Unit.fromName = function(name, proto) {
  for (var key in Unit) {
    var unit = Unit[key];
    if (unit.name && unit.name === name) {
      return new Unit(unit, proto);
    }
  }
};

module.exports = Unit;
