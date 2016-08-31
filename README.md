# EPOH

Multiplayer turn-based browser strategy game

## Try it! ##

Multiplayer server: http://www.epoh.io

Singleplayer demo: https://tautvilas.github.io/epoh/

## Installation ##

1) npm install

2a) open index.html with browser for singleplayer

2b) run "node serve" and open local multiplayer server at localhost:8080

Change game settings in js/Config.js

## Development ###

To run unit tests:

    $ make test

To lint your code:

    $ make lint

To build bundle.js, used when PRODUCTION is true in Config.js

    $ make bundle.js
