'use strict';

var Cost = function(cost) {
  this.cost = Object.keys(cost || {}).reduce(function(acc, key) {acc[key] = cost[key]; return acc;}, {});

  this.add = function(c, negate) {
    Object.keys(c).forEach(function(key) {
      if (!this.cost[key]) {
        this.cost[key] = 0;
      }
      this.cost[key] += c[key] * (negate ? -1 : 1);
    }, this);
    return this;
  };

  this.divide = function(d) {
    Object.keys(this.cost).forEach(function(key) {
      this.cost[key] = Math.floor(this.cost[key] / d);
    }, this);
    return this;
  };

  this.substract = function(c) {
    return this.add(c, true);
  };

  this.coveredBy = function(resources) {
    var cost = this.cost;
    return Object.keys(cost).reduce(function(acc, key) {
      if (resources[key] && cost[key] <= resources[key]) {
        return acc;
      } else {
        return false;
      }
    }, true);
  };

  this.toData = function() {
    return this.cost;
  };

  this.toString = function() {
    var cost = this.cost;
    return Object.keys(cost).reduce(function(acc, key) {
      return [acc, key, cost[key]].join(':');
    }, '');
  };

  this.toHtml = function() {
    var cost = this.cost;
    return Object.keys(cost).reduce(function(acc, key) {
      return acc + '<br />' + key + ':' + cost[key];
    }, '');
  };
};

Cost.toString = function(c) {
  return Cost.fromData(c).toString();
};

Cost.toHtml = function(c) {
  return Cost.fromData(c).toHtml();
};

Cost.add = function(c1, c2) {
  return Cost.fromData(c1).add(c2).toData();
};

Cost.divide = function(c, d) {
  return Cost.fromData(c).divide(d).toData();
};

Cost.covers = function(c1, c2) {
  return Cost.fromData(c1).coveredBy(c2);
};

Cost.substract = function(c1, c2) {
  return Cost.fromData(c1).substract(c2).toData();
};

Cost.fromData = function(data) {
  return new Cost(data);
};

module.exports = Cost;
