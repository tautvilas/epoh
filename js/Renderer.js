'use strict';

var Tile = require('./Tile');
var Rules = require('./Rules');
var CubeCoords = require('./CubeCoords');
var Coords = require('./Coords');
var Cost = require('./Cost');
var Config = require('./Config');
var Stream = require('./Stream');
var Q = require('./Q');
var WebComponent = require('./WebComponent');
var Unit = require('./Unit');
var Intent = require('./Intent');

var Renderer = function(tileStream) {
  var self = this;

  var StatusBox = new WebComponent('statusbox');
  var ResourceBox = new WebComponent('resources');
  var InfoBox = new WebComponent('infobox');
  var UnitBox = new WebComponent('unitbox');

  self.tileRequests = new Stream();
  self.intentBus = new Stream();

  self.center = new Coords(0, 0);
  self.centerTileScreen = new Coords(0, 0);
  self.positionDiff = new Coords(0, 0);

  self.tiles = {};
  self.tileElements = {};

  self.units = {};
  self.time = 0;
  self.matchTime = 0;
  self.matchTimerInterval = undefined;
  self.selectedTile = undefined;
  self.intentType = undefined;
  self.player = undefined;

  var screenCoordsToTileCoords = Function.prototype.memoized.bind(
      function _screen_coords_to_tile_coords(screenCoords, centerTileScreenCoords, centerTileCoords) {
    return screenCoords.add(centerTileCoords).substract(centerTileScreenCoords);
  });

  tileStream.onValue(function(tiles) {
    tiles.forEach(function(t) {
      var tile = Tile.fromJson(t);
      var currentTile = self.tiles[tile.coords];
      if (tile.name == Tile.SHROUD && currentTile && currentTile.name != Tile.SHROUD) {
        currentTile.shrouded = true;
        currentTile.dirty = false;
      } else {
        self.tiles[tile.coords] = tile;
      }
    });
    self.render();
  });

  self.reset = function(e) {
    self.selectedTile = undefined;

    clearInterval(self.timerInterval);
    clearInterval(self.matchTimerInterval);

    self.time = Math.round(e.time / 1000);
    self.timerInterval = setInterval(function() {
      self.time -= 1;
      StatusBox.setState({
        time: self.time
      });
    }, 1000);

    self.matchTime = Math.round(e.matchTime / 1000);
    self.matchTimerInterval = setInterval(function() {
      self.matchTime -= 1;
      var minutes = self.matchTime / 60;
      StatusBox.setState({
        match: minutes > 1 ? '_ min.'.printf(Math.round(minutes)) : self.matchTime
      });
    }, 1000);

    self.player = e.player;
    for (var coords in self.tiles) {
      self.tiles[coords].dirty = true;
    }
    self.render();
    updateStatus(e.tick);
    updateLog();
    updateScores(e.scores);
    document.getElementById('actions-wrapper').className = 'hidden';
  };

  function updateScores(scores) {
    Q.byId('scores').innerHTML = '';
    scores.forEach(function(s) {
      var score = Q.create('li');
      score.textContent = '_: _'.printf(s.name, s.score);
      Q.byId('scores').appendChild(score);
    });
  }

  function updateLog() {
    var log = Q.byId('log');
    log.innerHTML = '';
    self.player.log.forEach(function(l) {
      var message = Q.create('div');
      message.textContent = '[_] _'.printf(l.tick, l.message);
      message.className = 'message';
      message.onclick = (function() {
        self.setCenter(Coords.fromString(this.coords.representation));
      }).bind(l);
      log.appendChild(message);
      log.scrollTop = log.scrollHeight;
    });
  }

  function updateStatus(tick) {
    StatusBox.setState({
      score: self.player.score || 0,
      tick: tick,
      time: self.time
    });
    var player = self.player;
    var state = ['iron', 'gold', 'copper', 'gas', 'coal', 'oil'].reduce(function(acc, key) {
      acc[key] = '_/_ +_'.printf(player.resources[key], player.caps[key], player.income[key]);
      return acc;
    }, {});
    state.power = player.resources.power;
    ResourceBox.setState(state);
  }

  function renderActions(tile, screenCoords) {
    var unit = tile.unit;
    var intents = CubeCoords.fromOffset(tile.coords).neighbours().map(function(coords) {
      return self.tiles[coords.toOffset()];
    }).filter(function(t) {
      if (t && t.intents && t.intents[tile.coords]) {
        return true;
      }
      return false;
    });

    var $actions = Q.byId('actions');
    $actions.innerHTML = '';
    Q.byId('actions-wrapper').className = '';

    var actions = unit.actions.slice();
    if (unit.garrison) actions.unshift(Intent.UNGARRISON);
    self.intentType = actions[0];

    actions.forEach(function(act, index) {
      var unit = Unit.fromName(act);
      var cost = unit ? Cost.toString(unit.cost) : '-';
      var img = 'url(img/unit/_.png)'.printf(act);
      var $button = Q.create('button');
      $button.style['background-image'] = img;
      var $action = Q.create('div');
      $action.className = 'action';
      $action.title = cost;
      if (unit && !Cost.covers(unit.cost, self.player.resources)) {
        $action.style.opacity = '0.25';
      }
      $action.textContent = act;
      $action.appendChild($button);
      if (!index) {
        $action.querySelector('button').className = 'selected';
      }
      $action.onclick = (function(act) {
        self.intentType = act;
        var $selectedButton = $actions.querySelector('button[class=selected]');
        if ($selectedButton) {
          $selectedButton.className = '';
        }
        this.querySelector('button').className = 'selected';
      }).bind($action, act);
      $actions.appendChild($action);
    });
    if (intents.length) {
      var $action = Q.create('div');
      $action.textContent = 'cancel';
      $action.className = 'action';
      var $button = Q.create('button');
      $button.style['background-image'] = 'url(img/unit/cancel.png)';
      $action.appendChild($button);
      $action.onclick = function() {
        intents.forEach(function(t) {
          var intent = t.intents[tile.coords];
          self.player.resources = Cost.add(self.player.resources, intent.cost);
          delete t.intents[tile.coords];
          self.selectedTile = undefined;
          tile.unit.selected = false;
          renderUnits(tile, screenCoords, screenCoordsToScreenPosition(screenCoords, tile.coords, self.positionDiff, self.center));
          renderIntents(t, tileCoordsToScreenCoords(t.coords, self.centerTileScreen, self.center));
          updateStatus();
          self.intentBus.push({
            type: 'cancel',
            coords: tile.coords
          });
        });
        Q.byId('actions-wrapper').className = 'hidden';
      };
      $actions.appendChild($action);
    }
  }

  function renderUnit(tile) {
    var selectedScreenCoords = tileCoordsToScreenCoords(tile.coords, self.centerTileScreen, self.center);
    var selectedScreenPosition = screenCoordsToScreenPosition(selectedScreenCoords, tile.coords, self.positionDiff, self.center);
    renderUnits(tile, selectedScreenCoords, selectedScreenPosition);
  }

  function onTileClick() {
    var tile = self.tiles[screenCoordsToTileCoords(this, self.centerTileScreen, self.center)];
    var neighbourCoords = CubeCoords.fromOffset(tile.coords).neighbours();
    var selectedNeighbourTile;
    var index;
    neighbourCoords.forEach(function(coords, i) {
      var neighbour = self.tiles[coords.toOffset()];
      var unit = neighbour.unit;
      if (unit && unit.selected) {
        selectedNeighbourTile = neighbour;
        index = i;
      }
    });
    if (tile.unit && (tile.unit.player === self.player.name || Config.GOD_MODE) &&
        (!self.selectedTile || self.selectedTile.coords === tile.coords || !selectedNeighbourTile)) {
      tile.unit.selected = !tile.unit.selected;
      if (tile.unit.selected) {
        renderActions(tile, this);
        if (self.selectedTile) {
          self.selectedTile.unit.selected = false;
          renderUnit(self.selectedTile);
        }
        self.selectedTile = tile;
      } else {
        document.getElementById('actions-wrapper').className = 'hidden';
        self.selectedTile = undefined;
      }
    }
    if (selectedNeighbourTile) {
      var unit = selectedNeighbourTile.unit;
      if (unit && unit.selected) {
        var validatedIntent = validateIntent(selectedNeighbourTile, tile);
        if (validatedIntent) {
          selectedNeighbourTile.unit.selected = false;
          self.selectedTile = false;
          renderUnit(selectedNeighbourTile);
          var ncoords = selectedNeighbourTile.coords;
          self.intentBus.push(new Intent(ncoords, tile.coords, self.intentType));
          tile.intents[ncoords] = {
            direction: index,
            type: self.intentType,
            cost: validatedIntent.cost
          };
          self.player.resources = Cost.substract(self.player.resources, validatedIntent.cost);
          document.getElementById('actions-wrapper').className = 'hidden';
          updateStatus();
        }
      }
    }
    var screenPosition = screenCoordsToScreenPosition(this, tile.coords, self.positionDiff, self.center);
    renderIntents(tile, this);
    renderUnits(tile, this, screenPosition);
  }

  function renderIntents(tile, coords) {
    var $hex = self.tileElements[coords];
    var $intents = $hex.querySelectorAll('.intent');
    for (var i = 0; i < $intents.length; i++) {
      $intents[i].remove();
    }
    for (var c in tile.intents) {
      var intentId = 'intent-_'.printf(c);
      var $intent = Q.create('div');
      $intent.className = 'intent';
      $intent.setAttribute('id', intentId);
      var deg = -180 - 60 * tile.intents[c].direction;
      $intent.style.transform = 'rotate(_deg)'.printf(deg);
      $hex.appendChild($intent);
    }
  }

  function renderFields(tile, coords) {
    var $hex = self.tileElements[coords];
    var $fields = $hex.querySelectorAll('.field');
    for (var i = 0; i < $fields.length; i++) {
      $fields[i].remove();
    }
    //var odd = (self.centerTileScreen.y % 2) ? !(self.center.y % 2) : (self.center.y % 2);
    //var ccn = CubeCoords.fromOffset(coords, odd).neighbours();
    var ccn = CubeCoords.fromOffset(tile.coords).neighbours();
    ccn.forEach(function(c, i) {
      //var oc = screenCoordsToTileCoords(c.toOffset(odd), self.centerTileScreen, self.center);
      var oc = c.toOffset();
      var tile2 = self.tiles[oc];
      if (!tile2 || tile2.field === tile.field || !tile.field) return;
      var clazz = 'field';
      if (tile.field !== self.player.name) clazz += ' enemy';
      var $field = Q.create('div');
      $field.className = clazz;
      var deg = -180 - 60 * i;
      $field.style.transform = 'rotate(_deg)'.printf(deg);
      $hex.appendChild($field);
    });
  }

  function renderUnits(tile, coords, position) {
    var $hex = self.tileElements[coords];
    if (tile.unit && !tile.shrouded) {
      var $unit = self.units[tile.unit.id];
      if (!$unit) {
        $unit = Q.create('div');
        $unit.className = 'unit';
        var $health = Q.create('div');
        $health.className = 'health';
        $unit.appendChild($health);
        Q.byId('map').appendChild($unit);
        self.units[tile.unit.id] = $unit;
      }
      $unit.rendered = true;
      if (tile.unit.player !== self.player.name) {
        $unit.classList.add('enemy');
      } else {
        $unit.classList.remove('enemy');
      }
      if (tile.unit.garrison) {
        $unit.classList.add('garrisoned');
      } else {
        $unit.classList.remove('garrisoned');
      }
      $unit.setAttribute('active', tile.unit.selected || false);
      $hex.setAttribute('active', tile.unit.selected || false);
      var img = 'url(img/unit/_.png)'.printf(tile.unit.name);
      var healthBarWidth = 0;
      if (tile.unit.type !== Unit.TYPE_STRUCTURE) {
        healthBarWidth = (tile.unit.health / tile.unit.maxHealth * 100);
      } else if (tile.unit.garrison) {
        healthBarWidth = (tile.unit.garrison.health / tile.unit.garrison.maxHealth * 100);
      }
      $unit.querySelector('.health').style.width = healthBarWidth + '%';
      $unit.style['border-width'] = Config.DEBUG_VIEW ? 1 : 0;
      $unit.style['background-image'] = img;
      $unit.style['-webkit-filter'] = 'hue-rotate(_deg)'.printf(tile.unit.player === self.player.name ? 0 : tile.unit.hue);
      $unit.style.top = position.y + 'px';
      $unit.style.left = position.x + 'px';
      $unit.style.display = 'block';
    } else {
      $hex.setAttribute('active', 'false');
    }
  }

  function validateIntent(src, dst) {
    if (!self.selectedTile || !self.player) return false;
    var ccn = CubeCoords.fromOffset(src.coords).neighbours();
    var intents = ccn.reduce(function(acc, val) {
      var intent = self.tiles[val.toOffset()].intents[src.coords];
      if (intent) {
        acc[val.toOffset()] = intent;
      }
      return acc;
    }, {});
    return Rules.validateIntent(self.player, self.intentType, src, dst, intents);
  }

  function renderTile(tile, screenCoords, position) {
    var hex = self.tileElements[screenCoords];
    if (!hex) {
      hex = document.createElement('div');
      document.getElementById('map').appendChild(hex);
      self.tileElements[screenCoords] = hex;
      hex.addEventListener('click', onTileClick.bind(screenCoords));
      hex.addEventListener('contextmenu', (function(e) {
        var tile = self.tiles[screenCoordsToTileCoords(this, self.centerTileScreen, self.center)];
        e.preventDefault();
        if (tile) {
          self.setCenter(tile.coords);
        }
      }).bind(screenCoords));
      //hex.style.top = position.y + 'px';
      //hex.style.left = position.x + 'px';
      hex.addEventListener('mouseover', (function() {
        var tile = self.tiles[screenCoordsToTileCoords(this, self.centerTileScreen, self.center)];
        var tileUnit = tile.unit ? tile.unit.garrison || tile.unit : undefined;
        var baseUnit = tile.unit && tile.unit.garrison ? tile.unit : undefined;
        var unitName = '';
        if (baseUnit) {
          unitName = '_[_]'.printf(tileUnit.name.capitalize(), baseUnit.name.capitalize());
        } else if (tileUnit) {
          unitName = tileUnit.name.capitalize();
          if (tileUnit.garrisonable) {
            unitName += '[G]';
          }
        }
        var unit  = tileUnit ? '_ _/_'.printf(unitName, tileUnit.health, tileUnit.maxHealth) : 'None';
        var damage = tileUnit ? '_/_'.printf(Math.round(tileUnit.health / tileUnit.maxHealth * tileUnit.damage), tileUnit.damage) : 'None';

        UnitBox.setState({
          unit: unit,
          bombard: (tile.unit && tile.unit.rangedDmg) ? tile.unit.rangedDmg : 'None',
          damage: damage,
          owner: tile.unit ? tile.unit.player : 'None'
        });

        InfoBox.setState({
          terrain: '_ (_%)'.printf(tile.toString().capitalize(), (tile.unit && tile.unit.defense) ? tile.unit.defense : tile.defense),
          sector: '_ (_)'.printf(tile.sector.value, tile.coords),
          resource: (tile.resource || 'None').capitalize(),
          field: tile.field ? tile.field : 'None'
        });

        $('#cursor').hide();
        if (self.selectedTile && self.selectedTile.coords+'' !== tile.coords+'') {
          if (validateIntent(self.selectedTile, tile)) {
            var pos = screenCoordsToScreenPosition(this, tile.coords, self.positionDiff, self.center);
            $('#cursor').css({
              left: pos.x + 1,
              top: pos.y + 1
            });
            $('#cursor').addClass('hex').show();
          }
        }
      }).bind(screenCoords));
    }
    var clazz = ['hex', tile.name, tile.resource].join(' ');
    if (hex.className !== clazz) {
      hex.className = clazz;
    }
    if (Config.DEBUG_VIEW) {
      hex.setAttribute('coords', tile.coords);
    }
    var diffy = 0;
    /*
    if (tile.name == Tile.HILLS) {
      diffy = -5;
    } else if (tile.name == Tile.MOUNTAINS) {
      diffy = -10;
    }*/
    var x = position.x + 'px';
    var y = position.y + diffy + 'px';
    if (hex.style.top !== y) {
      hex.style.top = y;
    }
    if (hex.style.left !== x) {
      hex.style.left = x;
    }
    //hex.style['z-index'] = -diffy;
    if (tile.shrouded) {
      hex.style.opacity = '0.3';
    } else {
      hex.style.opacity = '1';
    }
  }

  self.setCenter = function(coords) {
    Q.byTag('body')[0].className = 'notransition';
    self.center = coords;
    self.render();
    Q.byTag('body')[0].className = '';
  };

  $(window).resize(function() {
    Q.byTag('body')[0].className = 'notransition';
    self.render();
    Q.byTag('body')[0].className = '';
  });

  var tileCoordsToScreenCoords = Function.prototype.memoized.bind(
    function _tile_coords_to_screen_coords(tileCoords, centerTileScreenCoords, centerTileCoords) {
      return tileCoords.add(centerTileScreenCoords).substract(centerTileCoords);
  });

  var adjustScreenCoords = Function.prototype.memoized.bind(
    function _adjust_screen_coords(screenCoords, tileCoords, center) {
      var dx = 0;
      /*jshint -W018 */
      if (center.y % 2 && !(tileCoords.y % 2)) {
        dx = -1;
      }
      return new Coords(screenCoords.x + dx, screenCoords.y);
  });

  var screenCoordsToScreenPosition = Function.prototype.memoized.bind(
    function _screen_coords_to_screen_position(screenCoords, tileCoords, positionDiff, center) {
      var adjustedCoords = adjustScreenCoords(screenCoords, tileCoords, center);
      var offset = 0;
      if (tileCoords.y % 2) {
        offset = Tile.WIDTH / 2;
      }
      if (center.y % 2) {
        if (tileCoords.y % 2) {
          offset -= Tile.WIDTH / 2;
        } else {
          offset += Tile.WIDTH / 2;
        }
      }
      var position = adjustedCoords.scale(new Coords(Tile.WIDTH, Tile.HEIGHT * 3 / 4))
        .add(new Coords(offset, -1 * adjustedCoords.y)).substract(positionDiff);
      return position;
  });


  self.render = function() {
    var viewport = $('#map');
    var windowSize = new Coords(viewport.width(), viewport.height());
    var windowCenter = windowSize.uscale(0.5).floor();
    var tileCenter = windowCenter.substract(new Coords(Tile.WIDTH / 2, Tile.HEIGHT / 4)).floor();

    self.centerTileScreen = new Coords(windowSize.x / Tile.WIDTH / 2, windowSize.y / (Tile.HEIGHT / 4 * 3) / 2).floor();
    var centerTileScreenPosition = self.centerTileScreen.scale(new Coords(Tile.WIDTH, Tile.HEIGHT * 3 / 4));
    self.positionDiff = centerTileScreenPosition.substract(tileCenter);

    var requiredTiles = [];
    for (var id in self.units) {
      self.units[id].rendered = false;
    }
    for (var x = -1; x * Tile.WIDTH < viewport.width() + Tile.WIDTH; x++) {
      for (var y = -1; y * Tile.HEIGHT / 2 < viewport.height(); y++) {
        var screenCoords = new Coords(x, y);
        var tileCoords = screenCoordsToTileCoords(screenCoords, self.centerTileScreen, self.center);
        var tile = self.tiles[tileCoords];
        if (!tile || tile.dirty) {
          requiredTiles.push(tileCoords);
          continue;
        }
        var screenPosition = screenCoordsToScreenPosition(screenCoords, tileCoords, self.positionDiff, self.center);

        renderTile(tile, screenCoords, screenPosition);
        renderUnits(tile, screenCoords, screenPosition);
        renderIntents(tile, screenCoords, screenPosition);
        renderFields(tile, screenCoords, screenPosition);
      }
    }
    if (requiredTiles.length) {
      self.tileRequests.push(requiredTiles);
    } else {
      for (id in self.units) {
        var u = self.units[id];
        if (!u.rendered) {
          delete self.units[id];
          u.remove();
        }
      }
    }
  };
};


