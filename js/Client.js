'use strict';

var Stream = require('./Stream');
var WebComponent = require('./WebComponent');
var Renderer = require('./Renderer');
var Sector = require('./Sector');
var Config = require('./Config');
var Coords = require('./Coords');
var Api = require('./Api');

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
          $('.endturn')[0].className = 'endturn';
          $('#blocker').removeClass('visible');
        }, 100);
        dirtyMap = false;
      }
    });
  }

  var addPlayer = function(username) {
    api.addPlayer(username).then(function(player) {
      $('.endturn').click(function() {
        $('title').text('Epoh');
        api.endTurn(username);
        $('.endturn').addClass('disabled');
      });
      $('#game').show();
      $('#login').hide();
      var renderer = initRenderer(bus);
      api.listen(function(evt) {
        if (evt.type === 'end') {
          alert('Match time is over. Refresh page to restart');
        } else if (evt.type === 'resolution') {
          $('#blocker').addClass('visible');
          $('.endturn')[0].className = 'endturn resolving';
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
              $('title').text('* Epoh');
            }
          });
        }
      });
      api.getStatus(username).then(function(e) {
        //mapCache = {};
        renderer.reset(e);
        $('title').text('* Epoh');
      });
      renderer.setCenter(Coords.fromString(player.base.representation));
    }).fail(function() {
      $('#login').show();
      $('#game').hide();
      $('#login .error').show();
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
      $('#game').show();
       username = window.location.search.replace("?username=", "") ||
                  currentUsername.user ||
                  (new Date()).getTime().toString();
      addPlayer(username);
    } else {
      $('#login').show();
      $('#username').focus();
      $('#version').text(currentUsername.version);
      $('#start').click(function() {
        username = $('#username').val();
        if (username) {
          addPlayer(username);
        }
      });
    }
  });
};
