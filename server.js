var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var WebSocketServer = require('websocket').server;
var http = require('http');

var Game = require('./js/Game');
var Map = require('./js/Map');
var Config = require('./js/Config');
var Intent = require('./js/Intent');
var pjson = require('./package.json');

var game = new Game(new Map(Config.MAP_SEED));

var users = {};
var app = express();

app.use(bodyParser.json());
app.use(cookieParser());

express.static.mime.define({
      'text/html': ['dry']
});

app.use('/lib', express.static('lib'));
app.use('/css', express.static('css'));
app.use('/img', express.static('img'));
app.use('/favicon.ico', express.static('img/favicon.ico'));

app.use('/index.html', express.static('index.html'));
app.use('/rules.html', express.static('rules.html'));
app.use('/main.js', express.static('main.js'));

if (Config.PRODUCTION) {
  app.use('/js/Config.js', express.static('js/Config.js'));
  app.use('/bundle.js', express.static('bundle.js'));
} else {
  app.use('/js', express.static('js'));
}

function secureId() {
  return require('crypto').randomBytes(64).toString('hex');
}

app.get('/', function(req, res) {
  res.redirect('/index.html');
});

// authentication
app.use(function(req, res, next) {
  console.log(req.method, req.url);
  if (req.cookies.name) {
    var name = req.cookies.name.substr(0, 30);
    var auth = users[name];
    if (auth === req.cookies.auth) {
      req.user = name;
    }
  }
  if ((req.url.substr(0, 7) === '/player' && req.method === 'POST') ||
      req.url.substr(0, 8) === '/session') {
    next();
  } else if (req.user) {
    next();
  } else {
    res.sendStatus(403);
  }
});

app.get('/session', function(req, res) {
  return res.json({
    user: req.user,
    version: pjson.version,
    numplayers: Object.keys(game.players).length,
    matchtime: game.getMatchTime()
  });
});

app.post('/player/:name', function(req, res) {
  var user = req.user;
  var name = req.params.name.substr(0, 30);
  var player;
  if (user === name) {
    player = game.getPlayer(name);
    res.json(player);
  } else {
    player = game.addPlayer(name);
    if (player) {
      users[name] = secureId();
      res.cookie('auth', users[name]);
      res.cookie('name', name);
      res.json(player);
    } else {
      res.sendStatus(409);
    }
  }
});

app.get('/player/:name', function(req, res) {
  var name = req.params.name.substr(0, 30);
  if (name === req.user) {
    res.json(game.getStatus(name));
  } else {
    res.sendStatus(403);
  }
});

app.get('/sector/:s', function(req, res) {
  var sectors = req.params.s.split(',');
  var response = [];
  sectors.forEach(function(s) {
    response.push(game.getSector(s, req.user));
  });
  var json = JSON.stringify(response);
  res.setHeader('Content-Type', 'application/json');
  res.write(json);
  res.end();
});

app.post('/intent', function(req, res) {
  var intent = req.body;
  res.json(game.addIntent(req.user, Intent.fromJson(intent)));
});

app.delete('/tile/:coords/intents', function(req, res) {
  var coords = req.params.coords;
  res.json(game.cancelIntents(req.user, coords));
});

app.post('/turn', function(req, res) {
  res.json(game.endTurn(req.user));
});

var server = app.listen(Config.PORT, function() {
  console.log('Epoh server online');
});

/* Websockets server */

var server = http.createServer();
server.listen(1337);
var wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false
});

var clients = [];
wsServer.on('request', function(request) {
  var connection = request.accept(null, request.origin);
  clients.push(connection);
  connection.on('message', function(message) {
    //console.log('Msg received: ' + message.utf8Data);
  });
});

game.events.onValue(function(value) {
  clients.forEach(function(client) {
    client.sendUTF(JSON.stringify(value));
  });
  if (value.type === 'end') {
    clients.forEach(function(client) {
      client.close();
    });
    console.log('MATCH ENDED', value.scores.length);
    if (value.scores.length) {
      console.log('Winner: _ (_)'.printf(value.scores[0].name, value.scores[0].score));
    }
    process.exit();
  }
});
