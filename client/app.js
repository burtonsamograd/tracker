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
    (LAMBDA (INDEX NAME SIZE)
      (THIS.CREATE SIZE (OR SIZE DEFAULT-NUM-CHANNELS))
      (THIS.CREATE INDEX INDEX)
      (THIS.CREATE NAME (OR NAME INDEX))
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
                init : function (index, name, size) {
    this.create('size', size || defaultNumChannels);
    this.create('index', index);
    this.create('name', name || index);
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
    (LAMBDA (NAME NAME)
      (THIS.CREATE SIZE (OR SIZE 1))
      (THIS.CREATE NAME (OR NAME INDEX)))) */
var Song = { type : 'Song',
             contains : 'Pattern',
             init : function (name, name) {
    this.create('size', size || 1);
    return this.create('name', name || index);
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
}, 'blur' : function (e) {
    return this.finished();
} },
                                     finished : function () {
    var value = parseInt('0x' + this.$el.val());
    if (!eval('isNaN')(value)) {
        this.modelValueFn.call(this.note, value);
    };
    return this.trigger('end-edit', this);
},
                                     render : function () {
    return this.$el;
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
    return this.$el.text(hex(this.note.pitch()) || '--');
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
    return this.$el.text(hex(this.note.fx()) || '--');
}
                 };
var NoteArgView = { type : 'NoteArgView',
                    tagName : 'span',
                    model : 'note',
                    events : { 'click' : function (e) {
    return this.trigger('edit', this);
} },
                    init : function (model) {
    return this.note.on('change', this.render, this);
},
                    render : function () {
    return this.$el.text(hex(this.note.arg()) || '--');
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
    return this.$el.text(hex(this.note.instrument()) || '--');
}
                         };
var NoteView = { type : 'NoteView',
                 model : 'note',
                 init : function (model) {
    this.create('pitchView', new View(NotePitchView, this.note));
    this.create('fxView', new View(NoteFxView, this.note));
    this.create('argView', new View(NoteArgView, this.note));
    this.create('instrumentView', new View(NoteInstrumentView, this.note));
    this.on('edit', function (e) {
        var el = null;
        if (this.pitchView() === e.value) {
            this.pitchView(el = new View(TwoCharacterHexValueEditView, this.note, this.note.pitch));
        } else if (this.fxView() === e.value) {
            this.fxView(el = new View(TwoCharacterHexValueEditView, this.note, this.note.fx));
        } else if (this.argView() === e.value) {
            this.argView(el = new View(TwoCharacterHexValueEditView, this.note, this.note.arg));
        } else if (this.instrumentView() === e.value) {
            this.instrumentView(el = new View(TwoCharacterHexValueEditView, this.note, this.note.instrument));
        };
        this.render();
        el.$el.focus();
        return el.$el.select();
    });
    return this.on('end-edit', function (e) {
        if (this.pitchView() === e.value) {
            this.pitchView(new View(NotePitchView, this.note));
        } else if (this.fxView() === e.value) {
            this.fxView(new View(NoteFxView, this.note));
        } else if (this.argView() === e.value) {
            this.argView(new View(NoteArgView, this.note));
        } else if (this.instrumentView() === e.value) {
            this.instrumentView(new View(NoteInstrumentView, this.note));
        };
        return this.render();
    });
},
                 render : function () {
    return this.$el.html([this.pitchView().render(), '&nbsp;', this.fxView().render(), '&nbsp;', this.argView().render(), '&nbsp;', this.instrumentView().render()]);
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
var ChannelGainView = { type : 'ChannelGainView',
                        model : 'channel',
                        events : { 'click' : function (e) {
    return this.trigger('edit', this);
} },
                        render : function () {
    return this.$el.text(hex(this.channel.gain()));
}
                      };
var ChannelPanView = { type : 'ChannelPanView',
                       model : 'channel',
                       events : { 'click' : function (e) {
    return this.trigger('edit', this);
} },
                       render : function () {
    return this.$el.text(hex(this.channel.pan()));
}
                     };
var ChannelControlsView = { type : 'ChannelControlsView',
                            model : 'channel',
                            init : function (model) {
    this.create('soloButton', new View(ChannelSoloButtonView, this.channel));
    this.create('muteButton', new View(ChannelMuteButtonView, this.channel));
    this.create('gainView', new View(ChannelGainView, this.channel));
    this.create('panView', new View(ChannelPanView, this.channel));
    this.on('edit', function (e) {
        var view = null;
        if (this.gainView() === e.value) {
            view = new View(TwoCharacterHexValueEditView, this.channel, this.channel.gain);
            this.gainView(view);
        } else if (this.panView() === e.value) {
            view = new View(TwoCharacterHexValueEditView, this.channel, this.channel.pan);
            this.panView(view);
        };
        this.render();
        view.$el.focus();
        return view.$el.select();
    });
    return this.on('end-edit', function (e) {
        if (this.gainView() === e.value) {
            this.gainView(new View(ChannelGainView, this.channel));
        } else if (this.panView() === e.value) {
            this.panView(new View(ChannelPanView, this.channel));
        };
        return this.render();
    });
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
    var i = 0;
    var html = this.channel.map(function (note) {
        var view = new View(NoteView, note);
        if (0 === i % 4) {
            view.$el.attr('class', 'NoteViewHighlight');
        };
        ++i;
        return view.render();
    });
    html.unshift(this.controlsView().render());
    html.unshift(this.monitorView().render());
    html.unshift(this.nameView().render());
    html.unshift(this.titleView().render());
    return this.$el.html(html);
}
                  };
/* (LOAD pattern-edit-view.ps) */
var PatternView = { type : 'PatternView',
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
