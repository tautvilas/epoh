# EPOH

Multiplayer turn-based browser strategy game

## Try it! ##

Gameplay video: https://www.youtube.com/watch?v=Sj8hVMo-hfs

Multiplayer server: http://www.epoh.io

Singleplayer demo: https://tautvilas.github.io/epoh/

![EPOH screenshot](https://tautvilas.github.com/epoh/img/screen.png)

## Gameplay guide ##

###Your first turn:###

Click on your base. Base actions will appear at the bottom of the screen. There is one worker garrisoned in the base.
You can ungarrison it by clicking ungarrison action and destination tile. All units move only by one tile so you can
only ungarrison worker next to the base. Select base again, you can build a new worker by selecting 'worker' action
and destination tile. Worker costs 100 iron. You can see your current resources in bottom left of the screen in format
[resource amount]/[max storage] income.

###Discover resources & build a mine:###

Move workers around the map to discover resources on map tiles. Resource type is
indicated by small circle on tile. Also tile & unit stats can be visible while hovering on tile in the top right section of the map.
When you discover resource on tile with a worker you can build mine on it. To build a mine select worker and destination tile.
Each building requires resources and you will not be allowed to build if you don't have enought of them. Building a mine on a tile
with resource will increase your income of that resource. Building bigmine will allso increase storage capacity. You can see
how much resources each building/unit costs by hoving on their build action image.

###Build units:###

Select base to build units. Your combat units can fight enemy units & takover enemy structures (except rover).

###Special worker buildings:###

Build amplifier to expand territory. Build teleport for fast unit transportation between tiles. Build powerplants on gas, oil or coal when you
run out of power.

More about game mechanics can be found [here](https://tautvilas.github.io/epoh/rules.html)

## Local installation & Development ##

1) npm install

2a) open index.html with browser for singleplayer

2b) run "node serve" and open local multiplayer server at localhost:8080

Change game settings in js/Config.js

To run unit tests:

    $ make test

To lint code:

    $ make lint

To build bundle.js, used when PRODUCTION is true in Config.js

    $ make bundle.js


## Misc ##

[Map generation visualization](https://tautvilas.github.io/epoh/perlin.html) (takes time to load)

[Info about cube coordinates calculation](http://www.redblobgames.com/grids/hexagons/)
