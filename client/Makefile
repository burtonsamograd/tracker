include ../Makefile.inc

LIBS=lib/jquery/dist/jquery.js lib/px2/px2.js 

DEPS=macros.ps utils.ps models.ps common-views.ps note-view.ps channel-view.ps pattern-view.ps song-view.ps song-pattern-edit-select-view.ps instrument-select-view.ps tools-view.ps tools-sampler-view.ps tools-effects-view.ps tools-modular-view.ps app-view.ps sound-manager.ps main.ps

app.js: $(LIBS) $(addsuffix .js,  $(basename $(DEPS))) 
	cat $^ > $@

deploy: min
	./compile.sh > index.html
	@echo "DEPLOYING!"

min: app.min.js style.min.css
.DUMMY: deploy min 

app.min.js: app.js
	uglify -s app.js -o app.min.js

style.min.css: style.css lib/font-awesome/css/font-awesome.css
	cat style.css lib/font-awesome/css/font-awesome.css > in.css
	uglify -c -s in.css -o style.min.css
	rm in.css


models.js:  models.ps macros.ps
common-views.js: common-views.ps macros.ps utils.ps
channel-view.js: channel-view.ps macros.ps utils.ps
instrument-select-view.js: instrument-select-view.ps macros.ps utils.ps
song-pattern-edit-select-view.js: song-pattern-edit-select-view.ps macros.ps utils.ps
song-view.js: song-view.ps macros.ps utils.ps

clean:
	rm -f *.js style.min.css
