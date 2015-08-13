/* --eval (DEFCONSTANT +DEBUG+ T)
 *//* (LOAD macros.ps) */

/* (DEFVAR DEFAULT-NUM-CHANNELS 12) */
var defaultNumChannels = 12;
/* (DEFVAR DEFAULT-PATTERN-LENGTH 32) */
var defaultPatternLength = 32;
/* (DEFMODEL *NOTE INIT
    (LAMBDA (INSTRUMENT PITCH FX)
      (THIS.CREATE INSTRUMENT INSTRUMENT)
      (THIS.CREATE PITCH PITCH)
      (THIS.CREATE FX FX))) */
var Note = { type : 'Note', init : function (instrument, pitch, fx) {
    this.create('instrument', instrument);
    this.create('pitch', pitch);
    return this.create('fx', fx);
} };
/* (DEFCONTAINER *CHANNEL *NOTE INIT
    (LAMBDA (INDEX NAME SIZE)
      (THIS.CREATE SIZE (OR SIZE DEFAULT-PATTERN-LENGTH))
      (THIS.CREATE INDEX INDEX)
      (THIS.CREATE NAME (OR NAME INDEX))
      (THIS.CREATE GAIN 128)
      (THIS.CREATE PAN 128)
      (THIS.CREATE MUTE F)
      (THIS.CREATE SOLO F)
      (DOTIMES (I (THIS.SIZE)) (THIS.ADD (NEW (*CLASS *NOTE)))))) */
var Channel = { type : 'Channel',
                contains : 'Note',
                init : function (index, name, size) {
    this.create('size', size || defaultPatternLength);
    this.create('index', index);
    this.create('name', name || index);
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
    (LAMBDA (INDEX NAME SIZE)
      (THIS.CREATE SIZE (OR SIZE DEFAULT-PATTERN-LENGTH))
      (THIS.CREATE INDEX INDEX)
      (THIS.CREATE NAME (OR NAME INDEX))
      (DOTIMES (I (THIS.SIZE)) (THIS.ADD (NEW (*CLASS *CHANNEL I)))))) */
var Pattern = { type : 'Pattern',
                contains : 'Channel',
                init : function (index, name, size) {
    this.create('size', size || defaultPatternLength);
    this.create('index', index);
    this.create('name', name || index);
    for (var i = 0; i < this.size(); i += 1) {
        this.add(new Class(Channel, i));
    };
}
              };
/* (DEFCONTAINER *SONG *PATTERN INIT
    (LAMBDA (NAME NAME)
      (THIS.CREATE SIZE (OR SIZE DEFAULT-PATTERN-LENGTH))
      (THIS.CREATE NAME (OR NAME INDEX)))) */
var Song = { type : 'Song',
             contains : 'Pattern',
             init : function (name, name) {
    this.create('size', size || defaultPatternLength);
    return this.create('name', name || index);
}
           };
/* (LOAD note-view.ps) */
var NotePitchView = { type : 'NotePitchView',
                      tagName : 'span',
                      model : 'note',
                      events : { 'click' : function (e) {
    return this.trigger('edit', this);
} },
                      init : function (model) {
    return this.note.on('change', this.render, this);
},
                      render : function () {
    return this.$el.text(this.note.pitch() || '--');
}
                    };
var NoteFxView = { type : 'NoteFxView',
                   tagName : 'span',
                   model : 'note',
                   events : { 'click' : function (e) {
    return this.trigger('edit', this);
} },
                   init : function (model) {
    return this.note.on('change', this.render, this);
},
                   render : function () {
    return this.$el.text(this.note.fx() || '--');
}
                 };
var NoteInstrumentView = { type : 'NoteInstrumentView',
                           tagName : 'span',
                           model : 'note',
                           events : { 'click' : function (e) {
    return this.trigger('edit', this);
} },
                           init : function (model) {
    return this.note.on('change', this.render, this);
},
                           render : function () {
    return this.$el.text(this.note.instrument() || '--');
}
                         };
var NoteValueEditView = { type : 'NoteValueEditView',
                          tagName : 'input type=\'text\' maxlength=\'2\' size=\'2\'',
                          model : 'note',
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
    this.modelValueFn.call(this.note, this.$el.val());
    return this.trigger('end-edit', this);
}
                        };
var NoteView = { type : 'NoteView',
                 model : 'note',
                 init : function (model) {
    this.create('pitchView', new View(NotePitchView, this.note));
    this.create('fxView', new View(NoteFxView, this.note));
    this.create('instrumentView', new View(NoteInstrumentView, this.note));
    this.on('edit', function (e) {
        var el = null;
        if (this.pitchView() === e.value) {
            this.pitchView(el = new View(NoteValueEditView, this.note, this.note.pitch));
        } else if (this.fxView() === e.value) {
            this.fxView(el = new View(NoteValueEditView, this.note, this.note.fx));
        } else if (this.instrumentView() === e.value) {
            this.instrumentView(el = new View(NoteValueEditView, this.note, this.note.instrument));
        };
        this.render();
        return el.$el.focus();
    });
    return this.on('end-edit', function (e) {
        if (this.pitchView() === e.value) {
            this.pitchView(new View(NotePitchView, this.note));
        } else if (this.fxView() === e.value) {
            this.fxView(new View(NoteFxView, this.note));
        } else if (this.instrumentView() === e.value) {
            this.instrumentView(new View(NoteInstrumentView, this.note));
        };
        return this.render();
    });
},
                 render : function () {
    return this.$el.html([this.pitchView().render(), '&nbsp;', this.fxView().render(), '&nbsp;', this.instrumentView().render()]);
}
               };
/* (LOAD channel-view.ps) */
var ChannelValueEditView = { type : 'ChannelValueEditView',
                             tagName : 'input type=\'text\' maxlength=\'2\' size=\'2\'',
                             model : 'note',
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
    this.modelValueFn.call(this.note, this.$el.val());
    return this.trigger('end-edit', this);
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
var ChannelGainView = { type : 'ChannelGainView',
                        model : 'channel',
                        render : function () {
    return this.$el.text(this.channel.gain().toString(16));
}
                      };
var ChannelPanView = { type : 'ChannelPanView',
                       model : 'channel',
                       render : function () {
    return this.$el.text(this.channel.pan().toString(16));
}
                     };
var ChannelControlsView = { type : 'ChannelControlsView',
                            model : 'channel',
                            init : function (model) {
    this.create('soloButton', new View(ChannelSoloButtonView, this.channel));
    this.create('muteButton', new View(ChannelMuteButtonView, this.channel));
    this.create('gainView', new View(ChannelGainView, this.channel));
    return this.create('panView', new View(ChannelPanView, this.channel));
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
                    events : { 'click' : function (e) {
    return this.trigger('channel-select', this);
} },
                    init : function (model) {
    this.create('nameView', new View(ChannelNameView, this.channel));
    this.create('controlsView', new View(ChannelControlsView, this.channel));
    this.create('selected', false);
    this.on('edit-name', function (e) {
        this.nameView(new View(ChannelNameEditView, this.channel, this.channel.name));
        this.render();
        return this.nameView().$el.focus();
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
    var html = this.channel.map(function (note) {
        return (new View(NoteView, note)).render();
    });
    html.unshift(this.controlsView().render());
    html.unshift(this.nameView().render());
    return this.$el.html(html);
}
                  };
/* (DEFVIEW *PATTERN-VIEW MODEL pattern CONTAINS ChannelView INIT
    (LAMBDA ()
      (THIS.PATTERN.ON ADD THIS.RENDER THIS)
      (THIS.PATTERN.EACH
       (LAMBDA (CHANNEL) (THIS.ADD (NEW (*VIEW *CHANNEL-VIEW CHANNEL)))) THIS)
      (THIS.CREATE 'CURRENT-CHANNEL-VIEW (THIS.AT 0))
      ((@ (THIS.AT 0) SELECTED) T)
      (THIS.ON CHANNEL-SELECT
       (LAMBDA (E)
         ((@ ((@ THIS CURRENT-CHANNEL-VIEW)) SELECTED) F)
         ((@ THIS CURRENT-CHANNEL-VIEW) E.VALUE)
         ((@ ((@ THIS CURRENT-CHANNEL-VIEW)) SELECTED) T))))
    RENDER
    (LAMBDA ()
      (THIS.$EL.HTML
       (THIS.MAP (LAMBDA (CHANNEL-VIEW) ((@ CHANNEL-VIEW RENDER))))))) */
var PatternView = { type : 'PatternView',
                    model : 'pattern',
                    contains : 'ChannelView',
                    init : function () {
    this.pattern.on('add', this.render, this);
    this.pattern.each(function (channel) {
        return this.add(new View(ChannelView, channel));
    }, this);
    this.create('currentChannelView', this.at(0));
    this.at(0).selected(true);
    return this.on('channel-select', function (e) {
        this.currentChannelView().selected(false);
        this.currentChannelView(e.value);
        return this.currentChannelView().selected(true);
    });
},
                    render : function () {
    return this.$el.html(this.map(function (channelView) {
        return channelView.render();
    }));
}
                  };
/* ((@ ($ DOCUMENT) READY)
    (LAMBDA ()
      (LET* ((NOTE (NEW (*CLASS *NOTE)))
             (PATTERN (NEW (*CLASS *PATTERN 0)))
             (NOTE-VIEW (NEW (*VIEW *NOTE-VIEW NOTE)))
             (PATTERN-VIEW (NEW (*VIEW *PATTERN-VIEW PATTERN))))
        ((@ ($ 'BODY) HTML) ((@ PATTERN-VIEW RENDER)))))) */
$(document).ready(function () {
    var note = new Class(Note);
    var pattern = new Class(Pattern, 0);
    var noteView = new View(NoteView, note);
    var patternView = new View(PatternView, pattern);
    return $('body').html(patternView.render());
});
