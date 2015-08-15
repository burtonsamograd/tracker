/* --eval (DEFCONSTANT +DEBUG+ T)
 *//* (LOAD macros.ps) */

/* (LOAD utils.ps) */
function hex(x, len) {
    var s;
    len = len || 2;
    return x && (s = x.toString(16), (s.length < len ? (function () {
        for (var i = 0; i < 1 + (len - s.length); i += 1) {
            s = 0 + s;
        };
    })() : null, s));
};
/* (DEFVAR DEFAULT-NUM-CHANNELS 12) */
var defaultNumChannels = 12;
/* (DEFVAR DEFAULT-PATTERN-LENGTH 32) */
var defaultPatternLength = 32;
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
    (LAMBDA (NAME SIZE)
      (THIS.CREATE SIZE (OR SIZE DEFAULT-PATTERN-LENGTH))
      (THIS.CREATE NAME NAME)
      (THIS.CREATE GAIN 128)
      (THIS.CREATE PAN 128)
      (THIS.CREATE MUTE F)
      (THIS.CREATE SOLO F)
      (DOTIMES (I (THIS.SIZE)) (THIS.ADD (NEW (*CLASS *NOTE)))))) */
var Channel = { type : 'Channel',
                contains : 'Note',
                init : function (name, size) {
    this.create('size', size || defaultPatternLength);
    this.create('name', name);
    this.create('gain', 128);
    this.create('pan', 128);
    this.create('mute', false);
    this.create('solo', false);
    for (var i = 0; i < this.size(); i += 1) {
        this.add(new Class(Note));
    };
}
              };
/* (DEFCONTAINER *PATTERN *CHANNEL INIT
    (LAMBDA (NAME SIZE)
      (THIS.CREATE NAME NAME)
      (THIS.CREATE SIZE (OR SIZE DEFAULT-NUM-CHANNELS))
      (DOTIMES (I (THIS.SIZE)) (THIS.ADD (NEW (*CLASS *CHANNEL I))))
      (THIS.ON CLOSE-CHANNEL (LAMBDA (E) (THIS.REMOVE E.VALUE)))
      (THIS.ON ADD-CHANNEL
       (LAMBDA (E)
         (LET ((I ((@ THIS INDEX-OF) E.VALUE)))
           ((@ THIS INSERT-AT) (1+ I) (NEW (*CLASS *CHANNEL --))))))
      (THIS.ON COPY-CHANNEL
       (LAMBDA (E)
         (LET ((I ((@ THIS INDEX-OF) E.VALUE)))
           ((@ THIS INSERT-AT) (1+ I) (E.VALUE.COPY)))))
      (THIS.ON MOVE-CHANNEL-LEFT
       (LAMBDA (E)
         (LET ((I ((@ THIS INDEX-OF) E.VALUE)))
           (IF (> I 0)
               (THIS.SWAP I (1- I))))))
      (THIS.ON MOVE-CHANNEL-RIGHT
       (LAMBDA (E)
         (LET ((I ((@ THIS INDEX-OF) E.VALUE)))
           (IF (< I (- THIS.LENGTH 1))
               (THIS.SWAP I (1+ I)))))))) */
var Pattern = { type : 'Pattern',
                contains : 'Channel',
                init : function (name, size) {
    this.create('name', name);
    this.create('size', size || defaultNumChannels);
    for (var i = 0; i < this.size(); i += 1) {
        this.add(new Class(Channel, i));
    };
    this.on('close-channel', function (e) {
        return this.remove(e.value);
    });
    this.on('add-channel', function (e) {
        var i = this.indexOf(e.value);
        return this.insertAt(i + 1, new Class(Channel, '--'));
    });
    this.on('copy-channel', function (e) {
        var i = this.indexOf(e.value);
        return this.insertAt(i + 1, e.value.copy());
    });
    this.on('move-channel-left', function (e) {
        var i = this.indexOf(e.value);
        return i > 0 ? this.swap(i, i - 1) : null;
    });
    return this.on('move-channel-right', function (e) {
        var i = this.indexOf(e.value);
        return i < this.length - 1 ? this.swap(i, i + 1) : null;
    });
}
              };
/* (DEFCONTAINER *SONG *PATTERN INIT
    (LAMBDA (NAME SIZE)
      (THIS.CREATE 'SIZE (OR SIZE 1))
      (THIS.CREATE 'NAME (OR NAME INDEX))
      (DOTIMES (I ((@ THIS SIZE))) (THIS.ADD (NEW (*CLASS *PATTERN I)))))) */
var Song = { type : 'Song',
             contains : 'Pattern',
             init : function (name, size) {
    this.create('size', size || 1);
    this.create('name', name || index);
    for (var i = 0; i < this.size(); i += 1) {
        this.add(new Class(Pattern, i));
    };
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
var TwoCharacterHexValueEditView = { type : 'TwoCharacterHexValueEditView',
                                     tagName : 'input type=\'text\' maxlength=\'2\' size=\'2\'',
                                     init : function (model, modelValueFn) {
    this.modelValueFn = modelValueFn;
    return this.$el.val((modelValueFn.call(this.model) || '').toString(16));
},
                                     events : { 'keypress' : function (e) {
    return e.keyCode === 13 ? this.finished() : null;
}, 'focusout' : function (e) {
    return this.finished();
} },
                                     finished : function (silent) {
    var value = parseInt('0x' + this.$el.val());
    if (!eval('isNaN')(value)) {
        this.modelValueFn.call(this.note, value);
    };
    return !silent ? this.trigger('end-edit', this) : null;
}
                                   };
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
                                  className : 'TinyButton',
                                  events : { 'click' : function (e) {
    return this.channel.trigger('move-channel-left', this.channel);
} },
                                  render : function () {
    return this.$el.html('\u2190');
}
                                };
var ChannelMoveRightButtonView = { type : 'ChannelMoveRightButtonView',
                                   model : 'channel',
                                   className : 'TinyButton',
                                   events : { 'click' : function (e) {
    return this.channel.trigger('move-channel-right', this.channel);
} },
                                   render : function () {
    return this.$el.html('\u2192');
}
                                 };
var ChannelAddButtonView = { type : 'ChannelAddButtonView',
                             model : 'channel',
                             className : 'TinyButton',
                             events : { 'click' : function (e) {
    return this.channel.trigger('add-channel', this.channel);
} },
                             render : function () {
    return this.$el.html('+');
}
                           };
var ChannelCopyButtonView = { type : 'ChannelCopyButtonView',
                              model : 'channel',
                              className : 'TinyButton',
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
var ChannelTitleView = { type : 'ChannelTitleView',
                         model : 'channel',
                         init : function (model) {
    this.create('leftButton', new View(ChannelMoveLeftButtonView, model));
    this.create('rightButton', new View(ChannelMoveRightButtonView, model));
    this.create('closeButton', new View(ChannelCloseButtonView, model));
    this.create('addButton', new View(ChannelAddButtonView, model));
    return this.create('copyButton', new View(ChannelCopyButtonView, model));
},
                         render : function () {
    var html = [this.leftButton().render(), this.rightButton().render(), this.addButton().render(), this.copyButton().render(), this.closeButton().render()];
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
    var html = [this.gainView().render(), this.soloButton().render(), this.muteButton().render(), this.panView().render()];
    return this.$el.html(html);
}
                          };
var ChannelNameEditView = { type : 'ChannelNameEditView',
                            tagName : 'input type=\'text\' size=\'8\'',
                            model : 'channel',
                            init : function (model, modelValueFn) {
    this.modelValueFn = modelValueFn;
    return this.$el.val(modelValueFn.call(this.note));
},
                            events : { 'keypress' : function (e) {
    return e.keyCode === 13 ? this.finished() : null;
}, 'blur' : function (e) {
    return this.finished();
} },
                            finished : function () {
    this.modelValueFn.call(this.note, this.$el.val() || this.channel.index());
    return this.trigger('end-edit-name', this);
}
                          };
var ChannelNameView = { type : 'ChannelNameView',
                        model : 'channel',
                        events : { 'click' : function (e) {
    return this.trigger('edit-name');
} },
                        render : function () {
    return this.$el.text(this.channel.name());
}
                      };
var ChannelView = { type : 'ChannelView',
                    model : 'channel',
                    events : { 'mousedown' : function (e) {
    return e.preventDefault();
}, 'click' : function (e) {
    e.preventDefault();
    return this.trigger('channel-select', this);
} },
                    init : function (model) {
    this.create('titleView', new View(ChannelTitleView, this.channel));
    this.create('nameView', new View(ChannelNameView, this.channel));
    this.create('controlsView', new View(ChannelControlsView, this.channel));
    this.create('monitorView', new View(ChannelMonitorView));
    this.create('selected', false);
    this.on('edit-name', function (e) {
        this.nameView(new View(ChannelNameEditView, this.channel, this.channel.name));
        this.render();
        this.nameView().$el.focus();
        return this.nameView().$el.select();
    });
    this.on('end-edit-name', function (e) {
        this.nameView(new View(ChannelNameView, this.channel));
        return this.render();
    });
    return this.on('change:selected', function (e) {
        return this.$el.toggleClass('ChannelSelected');
    });
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
        return view.render();
    }, this);
    html.unshift(this.controlsView().render());
    html.unshift(this.monitorView().render());
    html.unshift(this.nameView().render());
    html.unshift(this.titleView().render());
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
        this.add(view);
        return view.render();
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
    view.render();
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
        for (var view = null, _js_idx1 = 0; _js_idx1 < views.length; _js_idx1 += 1) {
            view = views[_js_idx1];
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
var PatternModeLineView = { type : 'PatternModeLineView',
                            model : 'pattern',
                            init : function (model) {
    return this.pattern.on('change:name', this.render, this);
},
                            render : function () {
    return this.$el.html(this.pattern.name());
}
                          };
var PatternView = { type : 'PatternView',
                    model : 'pattern',
                    init : function (model) {
    this.create('editor', new View(PatternEditView, this.pattern));
    return this.create('modeLine', new View(PatternModeLineView, this.pattern));
},
                    render : function () {
    var html = [this.editor().$el, this.modeLine().$el];
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
/* (DEFVIEW *SONG-VIEW MODEL song CONTAINS '*PATTERN-VIEW INIT
    (LAMBDA (MODEL)
      ((@ THIS SONG EACH)
       (LAMBDA (PATTERN) (THIS.ADD (NEW (*VIEW *PATTERN-VIEW PATTERN)))) THIS))
    RENDER
    (LAMBDA ()
      ((@ THIS $EL HTML)
       (THIS.MAP (LAMBDA (PATTERN-VIEW) (@ PATTERN-VIEW $EL)))))) */
var SongView = { type : 'SongView',
                 model : 'song',
                 contains : 'PatternView',
                 init : function (model) {
    return this.song.each(function (pattern) {
        return this.add(new View(PatternView, pattern));
    }, this);
},
                 render : function () {
    return this.$el.html(this.map(function (patternView) {
        return patternView.$el;
    }));
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
