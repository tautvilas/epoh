client_files = js/Function.js \
							 js/String.js \
							 js/Array.js \
							 js/Stream.js \
							 js/Coords.js \
							 js/Cost.js \
							 js/CubeCoords.js \
							 js/Tile.js \
							 js/Sector.js \
							 js/Intent.js \
							 js/Unit.js \
							 js/Rules.js \
							 js/WebComponent.js \
							 js/Q.js \
							 js/Renderer.js \
							 js/Client.js \
							 js/NodeApi.js

uglify = ./node_modules/uglify-js/bin/uglifyjs
mocha = ./node_modules/mocha/bin/mocha
jshint = ./node_modules/jshint/bin/jshint

bundle.js: $(client_files)
	$(uglify) -cm --lint $(client_files) > bundle.js

.PHONY: test lint deploy

test: js/*.spec.js
	$(mocha) js/*.spec.js

lint: js/*.js server.js
	$(jshint) js/ server.js

deploy: test lint bundle.js
	npm install
	npm version patch
	git push --follow-tags
	scp bundle.js epoh:~/epoh/
	rsync -avz --exclude js/Config.js . epoh:~/epoh
	git log | grep commit | wc
