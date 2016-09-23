'use strict';

var Stream = require('./Stream');
var WebComponent = require('./WebComponent');
var Renderer = require('./Renderer');
var Sector = require('./Sector');
var Config = require('./Config');
var Coords = require('./Coords');
var Api = require('./Api');
var Q = require('./Q');

var Client = function() {
  var mapCache = {};
  var api = new Api();
  var username;
  var dirtyMap = true;
  var statusBox = new WebComponent('status');

  var bus = new Stream();
  function getSectors(sectors) {
    sectors.forEach(function(s) {
      mapCache[s] = true;
    });
    return api.getSectors(sectors, username).then(function(data) {
      data.forEach(function(s, i) {
        mapCache[sectors[i]] = s;
      });
      bus.push([].concat.apply([], data));
      if (dirtyMap) {
        setTimeout(function() {
          Q.byClass('endturn')[0].className = 'endturn';
          Q.byId('blocker').className = '';
        }, 100);
        dirtyMap = false;
      }
    });
  }

  var addPlayer = function(username) {
    api.addPlayer(username).then(function(player) {
      Q.byClass('endturn')[0].onclick = function() {
        Q.byTag('title')[0].textContent = 'Epoh';
        api.endTurn(username);
        Q.byClass('endturn')[0].classList.add('disabled');
      };
      Q.byId('game').style.display = 'block';
      Q.byId('login').style.display = 'none';
      var renderer = initRenderer(bus);
      api.listen(function(evt) {
        if (evt.type === 'end') {
          alert('Match time is over. Refresh page to restart');
        } else if (evt.type === 'resolution') {
          Q.byId('blocker').className = 'visible';
          Q.byClass('endturn')[0].className = 'endturn resolving';
        } else if (evt.type === 'orders') {
          api.getStatus(username).then(function(e) {
            if (!e.player.units) {
              alert("You lost!");
              dirtyMap = true;
              mapCache = {};
              renderer.reset(e);
            } else {
              dirtyMap = true;
              mapCache = {};
              renderer.reset(e);
              Q.byTag('title')[0].textContent = '* Epoh';
            }
          });
        }
      });
      api.getStatus(username).then(function(e) {
        //mapCache = {};
        renderer.reset(e);
        Q.byTag('title')[0].textContent = '* Epoh';
      });
      renderer.setCenter(Coords.fromString(player.base.representation));
    }).catch(function() {
      Q.byId('game').style.display = 'none';
      Q.byId('login').style.display = 'block';
      Q.byId('login').querySelector('.error').style.display = 'block';
    });
  };

  function initRenderer(bus) {
    var renderer = new Renderer(bus);

    renderer.tileRequests.onValue(function(values) {
      var sectors = [];
      if (values.length) {
        values.forEach(function(val) {
          var sector = Sector.fromTileCoords(val);
          if (!mapCache[sector.value] && sectors.indexOf(sector.value) === -1) {
            sectors.push(sector.value);
          }
        });
      }
      if (sectors.length) {
        getSectors(sectors);
      }
    });

    renderer.intentBus.onValue(function(intent) {
      if (intent.type === 'cancel') {
        api.cancelIntents(username, intent.coords);
      } else {
        api.addIntent(username, intent);
      }
    });

    return renderer;
  }

  api.checkSession().then(function(currentUsername) {
    statusBox.setState({
      numusers: currentUsername.numplayers,
      matchtime: Math.round(currentUsername.matchtime / 60 / 1000) + ' mins'
    });
    if (!Config.USERNAME_VIEW || currentUsername.user) {
      Q.byId('game').style.display = 'block';
       username = window.location.search.replace("?username=", "") ||
                  currentUsername.user ||
                  (new Date()).getTime().toString();
      addPlayer(username);
    } else {
      Q.byId('login').style.display = 'block';
      Q.byId('username').focus();
      Q.byId('version').textContent = currentUsername.version;
      Q.byId('start').onclick = function() {
        username = Q.byId('username').value;
        if (username) {
          addPlayer(username);
        }
      };
    }
  });
};
