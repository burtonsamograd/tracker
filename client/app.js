/* --eval (DEFCONSTANT +DEBUG+ T)
 *//* (LOAD macros.ps) */

/* (LOAD utils.ps) */
function hex(x, len) {
    len = len || 2;
    if (typeof x === 'number') {
        var s = x.toString(16);
        if (s.length < len) {
            for (var i = 0; i < 1 + (len - s.length); i += 1) {
                s = 0 + s;
            };
        };
        return s;
    };
};
/* (DEFVAR DEFAULT-NUM-CHANNELS 4) */
var defaultNumChannels = 4;
/* (DEFVAR DEFAULT-PATTERN-SIZE 16) */
var defaultPatternSize = 16;
/* (DEFVAR DEFAULT-NUM-PATTERNS 4) */
var defaultNumPatterns = 4;
/* (DEFVAR DEFAULT-TEMPO 0X80) */
var defaultTempo = 0x80;
/* (DEFVAR DEFAULT-TICS-PER-BEAT 6) */
var defaultTicsPerBeat = 6;
/* (DEFMODEL *NOTE INIT
    (LAMBDA (INSTRUMENT PITCH FX ARG)
      (THIS.CREATE INSTRUMENT INSTRUMENT)
      (THIS.CREATE PITCH PITCH)
      (THIS.CREATE FX FX)
      (THIS.CREATE ARG ARG))) */
var Note = { type : 'Note', init : function (instrument, pitch, fx, arg) {
    this.create('instrument', instrument);
    this.create('pitch', pitch);
    this.create('fx', fx);
    return this.create('arg', arg);
} };
/* (DEFCONTAINER *CHANNEL *NOTE INIT
    (LAMBDA (NAME INDEX SIZE)
      (THIS.CREATE NAME NAME)
      (THIS.CREATE INDEX INDEX)
      (THIS.CREATE SIZE (OR SIZE DEFAULT-PATTERN-SIZE))
      (THIS.CREATE GAIN 128)
      (THIS.CREATE PAN 128)
      (THIS.CREATE MUTE F)
      (THIS.CREATE SOLO F)
      (DOTIMES (I (THIS.SIZE)) (THIS.ADD (NEW (*CLASS *NOTE))))
      (THIS.ON change:size
       (LAMBDA (E)
         (LET ((OLD-VALUE E.VALUE) (NEW-VALUE ((@ THIS SIZE))))
           (IF (> OLD-VALUE NEW-VALUE)
               (THIS.SHRINK OLD-VALUE NEW-VALUE)
               (IF (< OLD-VALUE NEW-VALUE)
                   (THIS.GROW OLD-VALUE NEW-VALUE)))
           (UNLESS (= OLD-VALUE NEW-VALUE) (THIS.TRIGGER RESIZE))))))
    SHRINK
    (LAMBDA (OLD-VALUE NEW-VALUE)
      (LET ((TO-REMOVE (ARRAY)) (INDEX ((@ THIS SIZE))))
        (DOTIMES (I (- OLD-VALUE ((@ THIS SIZE))))
          ((@ TO-REMOVE PUSH) ((@ THIS AT) INDEX))
          (INCF INDEX))
        (DOLIST (E TO-REMOVE) (THIS.REMOVE E T))))
    GROW
    (LAMBDA (OLD-VALUE NEW-VALUE)
      (DOTIMES (I (- NEW-VALUE OLD-VALUE))
        ((@ THIS INSERT-AT) (1- (+ I OLD-VALUE)) (NEW (*CLASS *NOTE)) T)))) */
var Channel = { type : 'Channel',
                contains : 'Note',
                init : function (name, index, size) {
    this.create('name', name);
    this.create('index', index);
    this.create('size', size || defaultPatternSize);
    this.create('gain', 128);
    this.create('pan', 128);
    this.create('mute', false);
    this.create('solo', false);
    for (var i = 0; i < this.size(); i += 1) {
        this.add(new Class(Note));
    };
    return this.on('change:size', function (e) {
        var oldValue = e.value;
        var newValue = this.size();
        if (oldValue > newValue) {
            this.shrink(oldValue, newValue);
        } else {
            if (oldValue < newValue) {
                this.grow(oldValue, newValue);
            };
        };
        return oldValue !== newValue ? this.trigger('resize') : null;
    });
},
                shrink : function (oldValue, newValue) {
    var toRemove = [];
    var index = this.size();
    for (var i = 0; i < oldValue - this.size(); i += 1) {
        toRemove.push(this.at(index));
        ++index;
    };
    for (var e = null, _js_idx1 = 0; _js_idx1 < toRemove.length; _js_idx1 += 1) {
        e = toRemove[_js_idx1];
        this.remove(e, true);
    };
},
                grow : function (oldValue, newValue) {
    for (var i = 0; i < newValue - oldValue; i += 1) {
        this.insertAt((i + oldValue) - 1, new Class(Note), true);
    };
}
              };
/* (DEFCONTAINER *PATTERN *CHANNEL INIT
    (LAMBDA (NAME SIZE)
      (THIS.CREATE NAME NAME)
      (THIS.CREATE SIZE (OR SIZE DEFAULT-PATTERN-SIZE))
      (DOTIMES (I DEFAULT-NUM-CHANNELS)
        (THIS.ADD (NEW (*CLASS *CHANNEL (+ Channel  I) I ((@ THIS SIZE))))))
      (THIS.ON CLOSE-CHANNEL
       (LAMBDA (E)
         (LET ((I ((@ THIS INDEX-OF) E.VALUE)))
           (THIS.REMOVE E.VALUE)
           (DO ((J I (INCF J)))
               ((= J THIS.LENGTH))
             ((@ ((@ THIS AT) J) INDEX) J)))))
      (THIS.ON ADD-CHANNEL
       (LAMBDA (E)
         (LET ((I ((@ THIS INDEX-OF) E.VALUE)))
           ((@ THIS INSERT-AT) (1+ I)
            (NEW (*CLASS *CHANNEL (+ New  I) (1+ I) ((@ THIS SIZE)))))
           (DO ((J (1+ I) (INCF J)))
               ((= J THIS.LENGTH))
             ((@ ((@ THIS AT) J) INDEX) J)))))
      (THIS.ON COPY-CHANNEL
       (LAMBDA (E)
         (LET ((I ((@ THIS INDEX-OF) E.VALUE)) (NEW-CHANNEL (E.VALUE.COPY)))
           ((@ NEW-CHANNEL INDEX) (1+ I))
           ((@ THIS INSERT-AT) (1+ I) NEW-CHANNEL)
           ((@ NEW-CHANNEL NAME) (+ ((@ E.VALUE NAME))  ⎘)))))
      (THIS.ON MOVE-CHANNEL-LEFT
       (LAMBDA (E)
         (LET ((I ((@ THIS INDEX-OF) E.VALUE)))
           (WHEN (> I 0)
             (THIS.SWAP I (1- I))
             ((@ ((@ THIS AT) I) INDEX) I)
             ((@ E.VALUE INDEX) (1- I))))))
      (THIS.ON MOVE-CHANNEL-RIGHT
       (LAMBDA (E)
         (LET ((I ((@ THIS INDEX-OF) E.VALUE)))
           (WHEN (< I (- THIS.LENGTH 1))
             (THIS.SWAP I (1+ I))
             ((@ ((@ THIS AT) I) INDEX) I)
             ((@ E.VALUE INDEX) (1+ I))))))
      (THIS.ON change:size
       (LAMBDA (E)
         (THIS.EACH (LAMBDA (CHANNEL) ((@ CHANNEL SIZE) ((@ THIS SIZE))))))))) */
var Pattern = { type : 'Pattern',
                contains : 'Channel',
                init : function (name, size) {
    this.create('name', name);
    this.create('size', size || defaultPatternSize);
    for (var i = 0; i < defaultNumChannels; i += 1) {
        this.add(new Class(Channel, 'Channel ' + i, i, this.size()));
    };
    this.on('close-channel', function (e) {
        var i = this.indexOf(e.value);
        this.remove(e.value);
        var j = i;
        for (; j !== this.length; ) {
            this.at(j).index(j);
            var _js2 = ++j;
            j = _js2;
        };
    });
    this.on('add-channel', function (e) {
        var i = this.indexOf(e.value);
        this.insertAt(i + 1, new Class(Channel, 'New ' + i, i + 1, this.size()));
        var j = i + 1;
        for (; j !== this.length; ) {
            this.at(j).index(j);
            var _js2 = ++j;
            j = _js2;
        };
    });
    this.on('copy-channel', function (e) {
        var i = this.indexOf(e.value);
        var newChannel = e.value.copy();
        newChannel.index(i + 1);
        this.insertAt(i + 1, newChannel);
        return newChannel.name(e.value.name() + ' \u2398');
    });
    this.on('move-channel-left', function (e) {
        var i = this.indexOf(e.value);
        if (i > 0) {
            this.swap(i, i - 1);
            this.at(i).index(i);
            return e.value.index(i - 1);
        };
    });
    this.on('move-channel-right', function (e) {
        var i = this.indexOf(e.value);
        if (i < this.length - 1) {
            this.swap(i, i + 1);
            this.at(i).index(i);
            return e.value.index(i + 1);
        };
    });
    return this.on('change:size', function (e) {
        return this.each(function (channel) {
            return channel.size(this.size());
        });
    });
}
              };
/* (DEFCONTAINER *SONG *PATTERN INIT
    (LAMBDA (NAME SIZE TEMPO TICS-PER-BEAT GAIN PAN)
      (THIS.CREATE 'SIZE (OR SIZE DEFAULT-NUM-PATTERNS))
      (THIS.CREATE 'NAME (OR NAME INDEX))
      (THIS.CREATE 'TEMPO (OR TEMPO DEFAULT-TEMPO))
      (THIS.CREATE 'TICS-PER-BEAT (OR TICS-PER-BEAT DEFAULT-TICS-PER-BEAT))
      (THIS.CREATE 'GAIN (OR GAIN 128))
      (THIS.CREATE 'PAN (OR PAN 128))
      (DOTIMES (I ((@ THIS SIZE)))
        (THIS.ADD (NEW (*CLASS *PATTERN (+ Pattern  I)))))
      (THIS.ON CLOSE-PATTERN (LAMBDA (E) (THIS.REMOVE E.VALUE)))
      (THIS.ON ADD-PATTERN
       (LAMBDA (E)
         (LET ((I ((@ THIS INDEX-OF) E.VALUE)))
           ((@ THIS INSERT-AT) (1+ I) (NEW (*CLASS *PATTERN --))))))
      (THIS.ON COPY-PATTERN
       (LAMBDA (E)
         (LET ((I ((@ THIS INDEX-OF) E.VALUE)) (NEW-PATTERN (E.VALUE.COPY)))
           ((@ THIS INSERT-AT) (1+ I) NEW-PATTERN)
           ((@ NEW-PATTERN NAME) (+ ((@ E.VALUE NAME))  ⎘)))))
      (THIS.ON LINK-PATTERN
       (LAMBDA (E)
         (LET ((I ((@ THIS INDEX-OF) E.VALUE)))
           ((@ THIS INSERT-AT) (1+ I) E.VALUE))))
      (THIS.ON MOVE-PATTERN-UP
       (LAMBDA (E)
         (LET ((I ((@ THIS INDEX-OF) E.VALUE)))
           (IF (> I 0)
               (THIS.SWAP I (1- I))))))
      (THIS.ON MOVE-PATTERN-DOWN
       (LAMBDA (E)
         (LET ((I ((@ THIS INDEX-OF) E.VALUE)))
           (IF (< I (- THIS.LENGTH 1))
               (THIS.SWAP I (1+ I)))))))) */
var Song = { type : 'Song',
             contains : 'Pattern',
             init : function (name, size, tempo, ticsPerBeat, gain, pan) {
    this.create('size', size || defaultNumPatterns);
    this.create('name', name || index);
    this.create('tempo', tempo || defaultTempo);
    this.create('ticsPerBeat', ticsPerBeat || defaultTicsPerBeat);
    this.create('gain', gain || 128);
    this.create('pan', pan || 128);
    for (var i = 0; i < this.size(); i += 1) {
        this.add(new Class(Pattern, 'Pattern ' + i));
    };
    this.on('close-pattern', function (e) {
        return this.remove(e.value);
    });
    this.on('add-pattern', function (e) {
        var i = this.indexOf(e.value);
        return this.insertAt(i + 1, new Class(Pattern, '--'));
    });
    this.on('copy-pattern', function (e) {
        var i = this.indexOf(e.value);
        var newPattern = e.value.copy();
        this.insertAt(i + 1, newPattern);
        return newPattern.name(e.value.name() + ' \u2398');
    });
    this.on('link-pattern', function (e) {
        var i = this.indexOf(e.value);
        return this.insertAt(i + 1, e.value);
    });
    this.on('move-pattern-up', function (e) {
        var i = this.indexOf(e.value);
        return i > 0 ? this.swap(i, i - 1) : null;
    });
    return this.on('move-pattern-down', function (e) {
        var i = this.indexOf(e.value);
        return i < this.length - 1 ? this.swap(i, i + 1) : null;
    });
}
           };
/* (DEFCONTAINER *APP *SONG INIT
    (LAMBDA (NAME)
      (THIS.CREATE 'NAME (OR NAME untitled))
      (THIS.ADD (NEW (*CLASS *SONG ((@ THIS NAME))))))) */
var App = { type : 'App',
            contains : 'Song',
            init : function (name) {
    this.create('name', name || 'untitled');
    return this.add(new Class(Song, this.name()));
}
          };
/* (LOAD common-views.ps) */
var HexValueEditView = { type : 'HexValueEditView',
                         init : function (model, className, modelValueFn, width) {
    this.modelValueFn = modelValueFn;
    this.className = className;
    this.width = width || 2;
    this.placeholder = '-';
    for (var i = 0; i < this.width - 1; i += 1) {
        this.placeholder += '-';
    };
    return this.endEdit();
},
                         initialEvents : { 'dblclick' : function (e) {
    return this.edit();
} },
                         editEvents : { 'keypress' : function (e) {
    return e.keyCode === 13 ? this.finished() : null;
}, 'blur' : function (e) {
    return this.finished();
} },
                         edit : function () {
    var input = $('<input type=\'text\' maxlength=\'' + this.width + '\' size=\'' + this.width + '\'/>');
    input.val(hex(this.modelValueFn.call(this.model), this.width) || '');
    for (var event in this.editEvents) {
        input.bind(event, this.editEvents[event].bind(this));
    };
    this.$el.html(input);
    input.focus();
    input.select();
    return this.input = input;
},
                         endEdit : function () {
    this.$el.text(hex(this.modelValueFn.call(this.model), this.width) || this.placeholder);
    this.$el.attr('class', this.className);
    for (var event in this.initialEvents) {
        this.$el.bind(event, this.initialEvents[event].bind(this));
    };
    return this.input = null;
},
                         finished : function (silent) {
    var value = parseInt('0x' + this.input.val());
    if (!eval('isNaN')(value)) {
        this.modelValueFn.call(this.model, value);
    };
    return this.endEdit();
}
                       };
var StringValueEditView = { type : 'StringValueEditView',
                            init : function (model, className, modelValueFn, width) {
    this.modelValueFn = modelValueFn;
    this.className = className;
    this.width = width || 8;
    this.model.on('change', this.endEdit, this);
    return this.endEdit();
},
                            initialEvents : { 'dblclick' : function (e) {
    return this.edit();
} },
                            editEvents : { 'keypress' : function (e) {
    return e.keyCode === 13 ? this.finished() : null;
}, 'blur' : function (e) {
    return this.finished();
} },
                            edit : function () {
    var input = $('<input type=\'text\' maxlength=\'' + this.width + '\' size=\'' + this.width + '\'/>');
    input.val(this.modelValueFn.call(this.model) || '');
    for (var event in this.editEvents) {
        input.bind(event, this.editEvents[event].bind(this));
    };
    this.$el.html(input);
    input.focus();
    input.select();
    return this.input = input;
},
                            endEdit : function () {
    this.$el.text(this.modelValueFn.call(this.model));
    this.$el.attr('class', this.className);
    for (var event in this.initialEvents) {
        this.$el.bind(event, this.initialEvents[event].bind(this));
    };
    return this.input = null;
},
                            finished : function (silent) {
    this.modelValueFn.call(this.model, this.input.val() || '--');
    return this.endEdit();
}
                          };
/* (LOAD note-view.ps) */
var NoteView = { type : 'NoteView',
                 model : 'note',
                 events : { 'click' : function (e) {
    return this.trigger('note-select', this);
} },
                 init : function (model) {
    this.create('pitchView', new View(HexValueEditView, this.channel, 'NotePitchView', this.note.pitch));
    this.create('fxView', new View(HexValueEditView, this.channel, 'NoteFxView', this.note.fx));
    this.create('argView', new View(HexValueEditView, this.channel, 'NoteArgView', this.note.arg, 3));
    this.create('instrumentView', new View(HexValueEditView, this.channel, 'NoteInstrumentView', this.note.instrument));
    this.create('selected');
    return this.on('change:selected', function (e) {
        return this.selected() ? this.$el.addClass('NoteViewSelected') : this.$el.removeClass('NoteViewSelected');
    });
},
                 render : function () {
    return this.$el.html([this.pitchView().$el, this.fxView().$el, this.argView().$el, this.instrumentView().$el]);
}
               };
/* (LOAD channel-view.ps) */
var ChannelMoveLeftButtonView = { type : 'ChannelMoveLeftButtonView',
                                  model : 'channel',
                                  className : 'TinyButton ',
                                  events : { 'click' : function (e) {
    return this.channel.trigger('move-channel-left', this.channel);
} },
                                  render : function () {
    return this.$el.html('\u2190');
}
                                };
var ChannelMoveRightButtonView = { type : 'ChannelMoveRightButtonView',
                                   model : 'channel',
                                   className : 'TinyButton ',
                                   events : { 'click' : function (e) {
    return this.channel.trigger('move-channel-right', this.channel);
} },
                                   render : function () {
    return this.$el.html('\u2192');
}
                                 };
var ChannelAddButtonView = { type : 'ChannelAddButtonView',
                             model : 'channel',
                             className : 'TinyButton ',
                             events : { 'click' : function (e) {
    return this.channel.trigger('add-channel', this.channel);
} },
                             render : function () {
    return this.$el.html('+');
}
                           };
var ChannelCopyButtonView = { type : 'ChannelCopyButtonView',
                              model : 'channel',
                              className : 'TinyButton ',
                              events : { 'click' : function (e) {
    return this.channel.trigger('copy-channel', this.channel);
} },
                              render : function () {
    return this.$el.html('\u2398');
}
                            };
var ChannelCloseButtonView = { type : 'ChannelCloseButtonView',
                               model : 'channel',
                               className : 'TinyButton ChannelCloseButton',
                               events : { 'click' : function (e) {
    return confirm('Are you sure you want to delete this channel?') ? this.channel.trigger('close-channel', this.channel) : null;
} },
                               render : function () {
    return this.$el.html('\u2717');
}
                             };
var ChannelMonitorView = { type : 'ChannelMonitorView',
                           model : 'channel',
                           events : { 'click' : function (e) {
    return alert('click');
} }
                         };
var ChannelIndexView = { type : 'ChannelIndexView',
                         model : 'channel',
                         init : function () {
    return this.channel.on('change:index', this.render, this);
},
                         render : function () {
    return this.$el.html(hex(this.channel.index()) + ':');
}
                       };
var ChannelTitleView = { type : 'ChannelTitleView',
                         model : 'channel',
                         init : function (model, index) {
    this.create('indexView', new View(ChannelIndexView, model));
    this.create('leftButton', new View(ChannelMoveLeftButtonView, model));
    this.create('rightButton', new View(ChannelMoveRightButtonView, model));
    this.create('closeButton', new View(ChannelCloseButtonView, model));
    this.create('addButton', new View(ChannelAddButtonView, model));
    return this.create('copyButton', new View(ChannelCopyButtonView, model));
},
                         render : function () {
    var html = [this.indexView().$el, this.leftButton().$el, this.rightButton().$el, this.addButton().$el, this.copyButton().$el, this.closeButton().$el];
    return this.$el.html(html);
}
                       };
var ChannelSoloButtonView = { type : 'ChannelSoloButtonView',
                              model : 'channel',
                              events : { 'click' : function (e) {
    this.channel.solo(!this.channel.solo());
    return this.render();
} },
                              render : function () {
    if (this.channel.solo()) {
        this.$el.attr('class', 'Button ButtonEnabled');
    } else {
        this.$el.attr('class', 'Button ButtonDisabled');
    };
    return this.$el.text('S');
}
                            };
var ChannelMuteButtonView = { type : 'ChannelMuteButtonView',
                              model : 'channel',
                              events : { 'click' : function (e) {
    this.channel.mute(!this.channel.mute());
    return this.render();
} },
                              render : function () {
    if (this.channel.mute()) {
        this.$el.attr('class', 'Button ButtonEnabled');
    } else {
        this.$el.attr('class', 'Button ButtonDisabled');
    };
    return this.$el.text('M');
}
                            };
var ChannelControlsView = { type : 'ChannelControlsView',
                            model : 'channel',
                            init : function (model) {
    this.create('soloButton', new View(ChannelSoloButtonView, this.channel));
    this.create('muteButton', new View(ChannelMuteButtonView, this.channel));
    this.create('gainView', new View(HexValueEditView, this.channel, 'ChannelGainView', this.channel.gain, 2));
    return this.create('panView', new View(HexValueEditView, this.channel, 'ChannelPanView', this.channel.pan, 2));
},
                            render : function () {
    var html = [this.gainView().$el, this.soloButton().$el, this.muteButton().$el, this.panView().$el];
    return this.$el.html(html);
}
                          };
var ChannelView = { type : 'ChannelView',
                    model : 'channel',
                    contains : 'NoteView',
                    events : { 'mousedown' : function (e) {
    return e.preventDefault();
}, 'click' : function (e) {
    e.preventDefault();
    return this.trigger('channel-select', this);
} },
                    init : function (model) {
    this.create('titleView', new View(ChannelTitleView, this.channel));
    this.create('nameView', new View(StringValueEditView, this.channel, 'ChannelNameView', this.channel.name, 12));
    this.create('controlsView', new View(ChannelControlsView, this.channel));
    this.create('monitorView', new View(ChannelMonitorView));
    this.create('selected', false);
    this.on('change:selected', function (e) {
        return e.value ? this.$el.removeClass('ChannelSelected') : this.$el.addClass('ChannelSelected');
    });
    return this.channel.on('resize', this.render, this);
},
                    render : function () {
    this.clear();
    var i = 0;
    var html = this.channel.map(function (note) {
        var view = new View(NoteView, note);
        if (0 === i % 4) {
            view.$el.attr('class', 'NoteViewHighlight');
        };
        ++i;
        this.add(view);
        return view.$el;
    }, this);
    html.unshift(this.controlsView().$el);
    html.unshift(this.monitorView().$el);
    html.unshift(this.nameView().$el);
    html.unshift(this.titleView().$el);
    return this.$el.html(html);
}
                  };
/* (LOAD pattern-view.ps) */
var PatternEditView = { type : 'PatternEditView',
                        model : 'pattern',
                        contains : 'ChannelView',
                        init : function () {
    this.pattern.each(function (channel) {
        var view = new View(ChannelView, channel);
        return this.add(view);
    }, this);
    this.create('currentChannelView', this.at(0));
    this.at(0).selected(true);
    this.on('channel-select', function (e) {
        this.currentChannelView().selected(false);
        this.currentChannelView(e.value);
        return this.currentChannelView().selected(true);
    });
    this.create('currentNoteView', this.at(0).at(0));
    this.at(0).at(0).selected(true);
    this.on('note-select', function (e) {
        this.currentNoteView().selected(false);
        this.currentNoteView(e.value);
        return this.currentNoteView().selected(true);
    });
    this.pattern.on('add', function (e) {
        return this.added = e.value;
    }, this);
    this.pattern.on('remove', function (e) {
        return this.removed = e.value;
    }, this);
    return this.pattern.on('modified', this.rebuildViews, this);
},
                        addView : function () {
    var i = this.pattern.indexOf(this.added);
    var view = new View(ChannelView, this.added);
    this.insertAt(i, view);
    return this.added = null;
},
                        removeView : function () {
    var view = this.find(function (channelView) {
        return channelView.channel === this.removed;
    });
    this.remove(view);
    return this.removed = null;
},
                        reorderViews : function () {
    var views = this.map(function (e) {
        return e;
    });
    this.clear();
    var self = this;
    return this.pattern.each(function (channel) {
        for (var view = null, _js_idx2 = 0; _js_idx2 < views.length; _js_idx2 += 1) {
            view = views[_js_idx2];
            if (view.channel === channel) {
                self.add(view, true);
            };
        };
    });
},
                        rebuildViews : function (e) {
    if (this.added) {
        this.addView();
    } else {
        if (this.removed) {
            this.removeView(this.removed);
        } else {
            this.reorderViews();
        };
    };
    return this.render();
},
                        render : function () {
    return this.$el.html(this.map(function (channelView) {
        return channelView.$el;
    }));
}
                      };
var PatternNameView = { type : 'PatternNameView',
                        model : 'pattern',
                        init : function (model) {
    return this.create('edit', new View(StringValueEditView, this.pattern, 'PatternNameEditView', this.pattern.name, 32));
},
                        render : function () {
    var html = ['Name: ', this.edit().$el];
    return this.$el.html(html);
}
                      };
var PatternSizeView = { type : 'PatternSizeView',
                        model : 'pattern',
                        init : function (model) {
    return this.create('edit', new View(HexValueEditView, this.pattern, 'PatternSizeEditView', this.pattern.size));
},
                        render : function () {
    var html = ['Size: ', this.edit().$el];
    return this.$el.html(html);
}
                      };
var PatternModeLineView = { type : 'PatternModeLineView',
                            model : 'pattern',
                            init : function (model) {
    this.create('name', new View(PatternNameView, this.pattern));
    return this.create('size', new View(PatternSizeView, this.pattern));
},
                            render : function () {
    var html = [this.name().$el, this.size().$el];
    return this.$el.html(html);
}
                          };
var PatternView = { type : 'PatternView',
                    model : 'pattern',
                    init : function (model) {
    this.create('editor', new View(PatternEditView, this.pattern));
    return this.create('modeLine', new View(PatternModeLineView, this.pattern));
},
                    render : function () {
    var html = [this.modeLine().$el, this.editor().$el];
    return this.$el.html(html);
}
                  };
/* (LOAD song-view.ps) */
var PatternMoveUpButtonView = { type : 'PatternMoveUpButtonView',
                                model : 'pattern',
                                className : 'TinyButton ',
                                events : { 'click' : function (e) {
    return this.pattern.trigger('move-pattern-up', this.pattern);
} },
                                render : function () {
    return this.$el.html('\u2191');
}
                              };
var PatternMoveDownButtonView = { type : 'PatternMoveDownButtonView',
                                  model : 'pattern',
                                  className : 'TinyButton ',
                                  events : { 'click' : function (e) {
    return this.pattern.trigger('move-pattern-down', this.pattern);
} },
                                  render : function () {
    return this.$el.html('\u2193');
}
                                };
var PatternAddButtonView = { type : 'PatternAddButtonView',
                             model : 'pattern',
                             className : 'TinyButton ',
                             events : { 'click' : function (e) {
    return this.pattern.trigger('add-pattern', this.pattern);
} },
                             render : function () {
    return this.$el.html('+');
}
                           };
var PatternCopyButtonView = { type : 'PatternCopyButtonView',
                              model : 'pattern',
                              className : 'TinyButton ',
                              events : { 'click' : function (e) {
    return this.pattern.trigger('copy-pattern', this.pattern);
} },
                              render : function () {
    return this.$el.html('\u2398');
}
                            };
var PatternLinkButtonView = { type : 'PatternLinkButtonView',
                              model : 'pattern',
                              className : 'TinyButton ',
                              events : { 'click' : function (e) {
    return this.pattern.trigger('link-pattern', this.pattern);
} },
                              render : function () {
    return this.$el.html('\u2318');
}
                            };
var PatternCloseButtonView = { type : 'PatternCloseButtonView',
                               model : 'pattern',
                               className : 'TinyButton ',
                               events : { 'click' : function (e) {
    return confirm('Are you sure you want to delete this pattern?') ? this.pattern.trigger('close-pattern', this.pattern) : null;
} },
                               render : function () {
    return this.$el.html('\u2717');
}
                             };
var SongPatternEditSelectButtonsView = { type : 'SongPatternEditSelectButtonsView',
                                         model : 'pattern',
                                         init : function (model) {
    this.create('upButton', new View(PatternMoveUpButtonView, this.pattern));
    this.create('downButton', new View(PatternMoveDownButtonView, this.pattern));
    this.create('addButton', new View(PatternAddButtonView, this.pattern));
    this.create('copyButton', new View(PatternCopyButtonView, this.pattern));
    this.create('linkButton', new View(PatternLinkButtonView, this.pattern));
    return this.create('closeButton', new View(PatternCloseButtonView, this.pattern));
},
                                         render : function () {
    var html = [this.upButton().$el, this.downButton().$el, this.addButton().$el, this.copyButton().$el, this.linkButton().$el, this.closeButton().$el];
    return this.$el.html(html);
}
                                       };
var SongPatternIndexView = { type : 'SongPatternIndexView',
                             model : 'pattern',
                             init : function (model, index) {
    return this.index = index;
},
                             render : function () {
    return this.$el.html(hex(this.index) + ':');
}
                           };
var SongPatternEditSelectNameView = { type : 'SongPatternEditSelectNameView',
                                      model : 'pattern',
                                      events : { 'click' : function (e) {
    this.trigger('selectPattern', this.pattern);
    return this.select();
} },
                                      init : function (model, index, selected) {
    this.create('editView', new View(StringValueEditView, this.pattern, 'SongPatternEditSelectNameView', this.pattern.name, 32));
    this.create('indexView', new View(SongPatternIndexView, this.pattern, index));
    this.index = index;
    this.create('buttons', new View(SongPatternEditSelectButtonsView, this.pattern));
    return selected ? this.select() : null;
},
                                      select : function () {
    return this.$el.addClass('SongPatternEditSelectNameSelectedView');
},
                                      deselect : function () {
    return this.$el.removeClass('SongPatternEditSelectNameSelectedView');
},
                                      render : function () {
    var html = [this.indexView().$el, this.buttons().$el, this.editView().$el];
    return this.$el.html(html);
}
                                    };
var SongPatternEditNameSelectorView = { type : 'SongPatternEditNameSelectorView',
                                        model : 'song',
                                        contains : 'SongPatternEditSelectNameView',
                                        rebuildViews : function (selectedIndex) {
    var current = 0;
    return this.song.map(function (pattern) {
        this.add(new View(SongPatternEditSelectNameView, pattern, current, current === selectedIndex), true);
        return ++current;
    }, this);
},
                                        init : function (model) {
    this.create('currentPattern', this.song.at(0));
    this.rebuildViews(0);
    this.on('selectPattern', function (e) {
        this.map(function (patternNameView) {
            return patternNameView.deselect();
        });
        this.currentPattern(e.value);
        return true;
    });
    return this.song.on('modified', function () {
        this.clear(true);
        var patternIndex = this.song.indexOf(this.currentPattern()) || 0;
        this.currentPattern(this.song.at(patternIndex));
        this.trigger('selectPattern', this.currentPattern());
        this.rebuildViews(patternIndex);
        return this.render();
    }, this);
},
                                        render : function () {
    var html = this.map(function (nameView) {
        return nameView.$el;
    });
    return this.$el.html(html);
}
                                      };
var SongPatternEditSelectView = { type : 'SongPatternEditSelectView',
                                  model : 'song',
                                  init : function (model) {
    return this.create('nameSelector', new View(SongPatternEditNameSelectorView, this.song));
},
                                  render : function () {
    var html = ['Pattern Select', this.nameSelector().$el];
    return this.$el.html(html);
}
                                };
var InstrumentSelectView = { type : 'InstrumentSelectView',
                             model : 'song',
                             render : function () {
    return this.$el.html('Instrument');
}
                           };
var SongNameView = { type : 'SongNameView',
                     model : 'song',
                     className : 'SongControlsView',
                     init : function (model) {
    return this.create('edit', new View(StringValueEditView, this.song, 'SongControlsTitleEditView', this.song.name, 32));
},
                     render : function () {
    var html = ['Title:', this.edit().$el];
    return this.$el.html(html);
}
                   };
var SongTempoView = { type : 'SongTempoView',
                      model : 'song',
                      className : 'SongControlsView',
                      init : function (model) {
    return this.create('edit', new View(HexValueEditView, this.song, 'SongControlsEditView', this.song.tempo, null));
},
                      render : function () {
    var html = ['Tempo:', this.edit().$el];
    return this.$el.html(html);
}
                    };
var SongTpbView = { type : 'SongTpbView',
                    model : 'song',
                    className : 'SongControlsView',
                    init : function (model) {
    return this.create('edit', new View(HexValueEditView, this.song, 'SongControlsEditView', this.song.ticsPerBeat, null));
},
                    render : function () {
    var html = ['TPB:', this.edit().$el];
    return this.$el.html(html);
}
                  };
var SongGainView = { type : 'SongGainView',
                     model : 'song',
                     className : 'SongControlsView',
                     init : function (model) {
    return this.create('edit', new View(HexValueEditView, this.song, 'SongControlsEditView', this.song.gain, null));
},
                     render : function () {
    var html = ['Gain:', this.edit().$el];
    return this.$el.html(html);
}
                   };
var SongPanView = { type : 'SongPanView',
                    model : 'song',
                    className : 'SongControlsView',
                    init : function (model) {
    return this.create('edit', new View(HexValueEditView, this.song, 'SongControlsEditView', this.song.pan, null));
},
                    render : function () {
    var html = ['Pan:', this.edit().$el];
    return this.$el.html(html);
}
                  };
var SongControlsView = { type : 'SongControlsView',
                         model : 'song',
                         init : function (mode) {
    this.create('nameEdit', new View(SongNameView, this.song));
    this.create('tempoEdit', new View(SongTempoView, this.song));
    this.create('tpbEdit', new View(SongTpbView, this.song));
    this.create('gainEdit', new View(SongGainView, this.song));
    return this.create('panEdit', new View(SongPanView, this.song));
},
                         render : function () {
    var html = [this.gainEdit().$el, this.panEdit().$el, this.tempoEdit().$el, this.tpbEdit().$el, this.nameEdit().$el];
    return this.$el.html(html);
}
                       };
var SongView = { type : 'SongView',
                 model : 'song',
                 init : function (model) {
    this.create('currentPattern');
    this.create('patternEditor');
    this.create('patternEditSelect', new View(SongPatternEditSelectView, this.song));
    this.create('instrumentSelect', new View(InstrumentSelectView, this.song));
    this.create('songControls', new View(SongControlsView, this.song));
    this.on('change:currentPattern', function (e) {
        this.set('patternEditor', new View(PatternView, this.currentPattern()));
        return this.render();
    });
    this.set('currentPattern', this.song.at(0));
    return this.on('selectPattern', function (e) {
        return this.currentPattern(e.value);
    });
},
                 render : function () {
    var html = [this.songControls().$el, this.patternEditSelect().$el, this.patternEditor().$el, this.instrumentSelect().$el];
    return this.$el.html(html);
}
               };
/* (DEFVIEW *MINIBUFFER-VIEW MODEL app RENDER
    (LAMBDA ()
      ((@ THIS $EL HTML) <input class='MinibufferEditorView' type='text'>))) */
var MinibufferView = { type : 'MinibufferView',
                       model : 'app',
                       render : function () {
    return this.$el.html('<input class=\'MinibufferEditorView\' type=\'text\'>');
}
                     };
/* (DEFVIEW *APP-VIEW MODEL app CONTAINS '*SONG-VIEW INIT
    (LAMBDA (MODEL)
      (THIS.CREATE 'MINIBUFFER (NEW (*VIEW *MINIBUFFER-VIEW THIS.APP)))
      (THIS.CREATE 'SONG (NEW (*VIEW *SONG-VIEW ((@ THIS APP AT) 0)))))
    RENDER
    (LAMBDA ()
      (LET ((HTML
             (ARRAY (@ ((@ THIS SONG)) $EL) (@ ((@ THIS MINIBUFFER)) $EL))))
        ((@ THIS $EL HTML) HTML)))) */
var AppView = { type : 'AppView',
                model : 'app',
                contains : 'SongView',
                init : function (model) {
    this.create('minibuffer', new View(MinibufferView, this.app));
    return this.create('song', new View(SongView, this.app.at(0)));
},
                render : function () {
    var html = [this.song().$el, this.minibuffer().$el];
    return this.$el.html(html);
}
              };
/* (DEFVAR APP (NEW (*CLASS *APP))) */
var app = new Class(App);
/* ((@ ($ DOCUMENT) READY)
    (LAMBDA ()
      (LET ((APP-VIEW (NEW (*VIEW *APP-VIEW APP))))
        ((@ ($ 'BODY) HTML) (@ APP-VIEW $EL))
        ((@ ($ DOCUMENT) BIND) 'CLICK
         (LAMBDA (E) ((@ ($ .MinibufferEditorView) SELECT))))))) */
$(document).ready(function () {
    var appView = new View(AppView, app);
    $('body').html(appView.$el);
    return $(document).bind('click', function (e) {
        return $('.MinibufferEditorView').select();
    });
});
