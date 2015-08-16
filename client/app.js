/* --eval (DEFCONSTANT +DEBUG+ T)
 */
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
var Options = { type : 'Options', defaults : { defaultSongName : 'untitled',
                                               defaultPatternName : 'Pattern',
                                               defaultChannelName : 'Channel',
                                               defaultNumChannels : 4,
                                               defaultPatternSize : 16,
                                               defaultNumPatterns : 4,
                                               defaultTempo : 0x80,
                                               defaultTicsPerBeat : 6,
                                               defaultGain : 0x80,
                                               defaultPan : 0x80,
                                               userName : 'Dave',
                                               confirm : true
                                             } };
var Sample = { type : 'Sample', init : function (name, uri) {
    this.create('name', name);
    this.create('uri', uri);
    this.create('start', 0);
    this.create('end', 0);
    this.create('loop', false);
    this.create('pingPong', false);
    return this.create('envelope');
} };
var Samples = { type : 'Samples',
                contains : 'Sample',
                init : function () {
    this.on('add', function (e) {
        return this[e.value.name()] = e.value;
    });
    return this.on('remove', function (e) {
        return delete this[e.value.name()];
    });
}
              };
var samples = new Class(Samples);
samples.add(new Class(Sample, 'Sin', '/samples/sin.wav'));
samples.add(new Class(Sample, 'Saw', '/samples/saw.wav'));
samples.add(new Class(Sample, 'Square', '/samples/sqr.wav'));
samples.add(new Class(Sample, 'Triangle', '/samples/tri.wav'));
var Note = { type : 'Note', init : function (instrument, pitch, fx, arg) {
    this.create('instrument', instrument);
    this.create('pitch', pitch);
    this.create('fx', fx);
    return this.create('arg', arg);
} };
var Channel = { type : 'Channel',
                contains : 'Note',
                init : function (name, index, size) {
    if (name === undefined) {
        name = options.defaultChannelName();
    };
    if (index === undefined) {
        index = 0;
    };
    if (size === undefined) {
        size = options.defaultPatternSize();
    };
    this.create('name', name);
    this.create('index', index);
    this.create('size', size);
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
var Pattern = { type : 'Pattern',
                contains : 'Channel',
                init : function (name, size, numChannels) {
    if (name === undefined) {
        name = options.defaultPatternName();
    };
    if (size === undefined) {
        size = options.defaultPatternSize();
    };
    if (numChannels === undefined) {
        numChannels = options.defaultNumChannels();
    };
    this.create('name', name);
    this.create('size', size);
    for (var i = 0; i < numChannels; i += 1) {
        this.add(new Class(Channel, options.defaultChannelName() + ' ' + i, i, this.size()));
    };
    this.on('close-channel', function (e) {
        if (this.length > 1) {
            var i = this.indexOf(e.value);
            this.remove(e.value);
            var j = i;
            for (; j !== this.length; ) {
                this.at(j).index(j);
                var _js2 = ++j;
                j = _js2;
            };
        } else {
            return alert('I\'m sorry ' + options.userName() + ', but you can\'t delete the last channel.');
        };
    });
    this.on('add-channel', function (e) {
        var i = this.indexOf(e.value);
        this.insertAt(i + 1, new Class(Channel, options.defaultChannelName() + ' ' + (this.length + 1), i + 1, this.size()));
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
    this.on('change:size', function (e) {
        return this.each(function (channel) {
            return channel.size(this.size());
        });
    });
    this.on('play', this.play, this);
    return this.on('loop', this.loop, this);
},
                play : function () {
    sm.reset(null);
    this.each(function (channel) {
        var i = 0;
        return channel.each(function (note) {
            sm.note(i, note);
            return ++i;
        });
    });
    return sm.play();
},
                loop : function () {
    return alert('loopingPattern' + this.name());
}
              };
var Song = { type : 'Song',
             contains : 'Pattern',
             init : function (name, tempo, ticsPerBeat, gain, pan, numPatterns) {
    if (name === undefined) {
        name = options.defaultSongName();
    };
    if (tempo === undefined) {
        tempo = options.defaultTempo();
    };
    if (ticsPerBeat === undefined) {
        ticsPerBeat = options.defaultTicsPerBeat();
    };
    if (gain === undefined) {
        gain = options.defaultGain();
    };
    if (pan === undefined) {
        pan = options.defaultPan();
    };
    if (numPatterns === undefined) {
        numPatterns = options.defaultNumPatterns();
    };
    this.create('name', name);
    this.create('tempo', tempo);
    this.create('ticsPerBeat', ticsPerBeat);
    this.create('gain', gain);
    this.create('pan', pan);
    this.create('size', numPatterns);
    this.create('instruments', new Class(Samples));
    this.patternCounter = this.size();
    for (var i = 0; i < this.size(); i += 1) {
        this.add(new Class(Pattern, options.defaultPatternName() + ' ' + i), true);
    };
    this.on('close-pattern', this.closePattern);
    this.on('add-pattern', this.addPattern);
    this.on('copy-pattern', this.copyPattern);
    this.on('link-pattern', this.linkPattern);
    this.on('move-pattern-up', this.movePatternUp);
    return this.on('move-pattern-down', this.movePatternDown);
},
             closePattern : function (e) {
    return this.length > 1 ? this.remove(e.value) : alert('I\'m sorry ' + options.userName() + ', but you can\'t delete the last pattern.');
},
             addPattern : function (e) {
    var i = this.indexOf(e.value);
    return this.insertAt(i + 1, new Class(Pattern, options.defaultPatternName() + ' ' + ++this.patternCounter));
},
             copyPattern : function (e) {
    var i = this.indexOf(e.value);
    var newPattern = e.value.copy();
    this.insertAt(i + 1, newPattern);
    return newPattern.name(e.value.name() + ' \u2398');
},
             linkPattern : function (e) {
    var i = this.indexOf(e.value);
    return this.insertAt(i + 1, e.value);
},
             movePatternUp : function (e) {
    var i = this.indexOf(e.value);
    return i > 0 ? this.swap(i, i - 1) : null;
},
             movePatternDown : function (e) {
    var i = this.indexOf(e.value);
    return i < this.length - 1 ? this.swap(i, i + 1) : null;
},
             loadSample : function (sampleInstrument) {
    return this.instruments().add(sampleInstrument);
}
           };
var App = { type : 'App',
            contains : 'Song',
            init : function () {
    this.create('song', new Class(Song));
    return this.add(this.song());
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
    if (options.confirm()) {
        return confirm(options.userName() + ', are you sure you want to delete this channel?') ? this.channel.trigger('close-channel', this.channel) : null;
    } else {
        return this.channel.trigger('close-channel', this.channel);
    };
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
var PatternPlayButtonView = { type : 'PatternPlayButtonView',
                              model : 'pattern',
                              className : 'TinyButton ',
                              events : { 'click' : function (e) {
    return this.pattern.trigger('play', this.pattern);
} },
                              render : function () {
    return this.$el.html('\u2193');
}
                            };
var PatternLoopButtonView = { type : 'PatternLoopButtonView',
                              model : 'pattern',
                              className : 'TinyButton ',
                              events : { 'click' : function (e) {
    return this.pattern.trigger('loop', this.pattern);
} },
                              render : function () {
    return this.$el.html('\u2195');
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
    this.create('play', new View(PatternPlayButtonView, model));
    this.create('loop', new View(PatternLoopButtonView, model));
    this.create('name', new View(PatternNameView, model));
    return this.create('size', new View(PatternSizeView, model));
},
                            render : function () {
    var html = [this.play().$el, this.loop().$el, this.name().$el, this.size().$el];
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
    if (options.confirm()) {
        return confirm(options.userName() + ', are you sure you want to delete this pattern?') ? this.pattern.trigger('close-pattern', this.pattern) : null;
    } else {
        return this.pattern.trigger('close-pattern', this.pattern);
    };
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
    var html = ['Pattern Order', this.nameSelector().$el];
    return this.$el.html(html);
}
                                };
var InstrumentSelectNameView = { type : 'InstrumentSelectNameView',
                                 model : 'sample',
                                 init : function (model, index) {
    return this.create('index', index);
},
                                 events : { 'click' : function (e) {
    return this.trigger('instrumentSelect', this.sample);
} },
                                 render : function () {
    var html = hex(this.index()) + ': ' + this.sample.name();
    return this.$el.html(html);
}
                               };
var InstrumentSelectView = { type : 'InstrumentSelectView',
                             model : 'song',
                             init : function () {
    this.samples = this.song.instruments();
    this.samples.on('add', this.rebuildViews, this);
    this.samples.on('remove', this.rebuildViews, this);
    this.samples.on('modify', this.rebuildViews, this);
    this.rebuildViews();
    return this.on('instrumentSelect', function (e) {
        this.deselect();
        this.select(e.value);
        return true;
    });
},
                             deselect : function () {
    return this.map(function (nameView) {
        return nameView.$el.removeClass('InstrumentSelected');
    });
},
                             select : function (sample) {
    var view = this.find(function (nameView) {
        return nameView.sample === sample;
    });
    return view.$el.addClass('InstrumentSelected');
},
                             rebuildViews : function () {
    this.clear();
    var i = -1;
    this.samples.map(function (sample) {
        ++i;
        return this.add(new View(InstrumentSelectNameView, sample, i), true);
    }, this);
    return this.render();
},
                             render : function () {
    var html = this.map(function (nameView) {
        return nameView.$el;
    });
    html.unshift('Instruments: ' + hex(this.song.instruments().length));
    return this.$el.html(html);
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
    this.create('currentInstrument');
    this.create('patternEditor');
    this.create('patternEditSelect', new View(SongPatternEditSelectView, this.song));
    this.create('instrumentSelect', new View(InstrumentSelectView, this.song));
    this.create('songControls', new View(SongControlsView, this.song));
    this.on('change:currentPattern', function (e) {
        this.set('patternEditor', new View(PatternView, this.currentPattern()));
        return this.render();
    });
    this.set('currentPattern', this.song.at(0));
    this.on('selectPattern', function (e) {
        return this.currentPattern(e.value);
    });
    return this.on('instrumentSelect', function (e) {
        return this.currentInstrument(e.value);
    });
},
                 loadSample : function (sample) {
    return this.song.loadSample(sample);
},
                 render : function () {
    var html = [this.songControls().$el, this.patternEditSelect().$el, this.patternEditor().$el, this.instrumentSelect().$el];
    return this.$el.html(html);
}
               };
var ToolsOpenPanelView = { type : 'ToolsOpenPanelView',
                           model : 'app',
                           className : 'ToolsButtonView',
                           tagName : 'span',
                           events : { 'click' : function (e) {
    return this.trigger('open-tools-panel', this.app);
} },
                           render : function () {
    var html = ['\u2935'];
    return this.$el.html(html);
}
                         };
var ToolsClosePanelView = { type : 'ToolsClosePanelView',
                            model : 'app',
                            className : 'ToolsButtonView',
                            tagName : 'span',
                            events : { 'click' : function (e) {
    return this.trigger('close-tools-panel', this.app);
} },
                            render : function () {
    var html = ['\u2934'];
    return this.$el.html(html);
}
                          };
var ToolsSamplerButtonView = { type : 'ToolsSamplerButtonView',
                               model : 'app',
                               className : 'ToolsButtonView',
                               tagName : 'span',
                               events : { 'click' : function (e) {
    return this.trigger('open-sampler', this.app);
} },
                               render : function () {
    var html = ['Sampler'];
    return this.$el.html(html);
}
                             };
var ToolsEffectsButtonView = { type : 'ToolsEffectsButtonView',
                               model : 'app',
                               className : 'ToolsButtonView',
                               tagName : 'span',
                               events : { 'click' : function (e) {
    return this.trigger('open-effects', this.app);
} },
                               render : function () {
    var html = ['Effects'];
    return this.$el.html(html);
}
                             };
var ToolsModularButtonView = { type : 'ToolsModularButtonView',
                               model : 'app',
                               className : 'ToolsButtonView',
                               tagName : 'span',
                               events : { 'click' : function (e) {
    return this.trigger('open-modular', this.app);
} },
                               render : function () {
    var html = ['Modular'];
    return this.$el.html(html);
}
                             };
var ToolsNotesButtonView = { type : 'ToolsNotesButtonView',
                             model : 'app',
                             className : 'ToolsButtonView',
                             tagName : 'span',
                             events : { 'click' : function (e) {
    return this.trigger('open-notes', this.app);
} },
                             render : function () {
    var html = ['Notes'];
    return this.$el.html(html);
}
                           };
var ToolsButtonsView = { type : 'ToolsButtonsView',
                         model : 'app',
                         init : function (model) {
    this.create('samplerButton', new View(ToolsSamplerButtonView, this.app));
    this.create('effectsButton', new View(ToolsEffectsButtonView, this.app));
    this.create('modularButton', new View(ToolsModularButtonView, this.app));
    this.create('notesButton', new View(ToolsNotesButtonView, this.app));
    this.add(this.samplerButton());
    this.add(this.effectsButton());
    this.add(this.modularButton());
    this.add(this.notesButton());
    this.on('open-sampler', function () {
        this.select(this.samplerButton());
        return true;
    });
    this.on('open-effects', function () {
        this.select(this.effectsButton());
        return true;
    });
    this.on('open-modular', function () {
        this.select(this.modularButton());
        return true;
    });
    return this.on('open-notes', function () {
        this.select(this.notesButton());
        return true;
    });
},
                         deselect : function () {
    return this.each(function (buttonView) {
        return buttonView.$el.removeClass('ToolsButtonSelected');
    });
},
                         select : function (button) {
    this.deselect();
    return button.$el.addClass('ToolsButtonSelected');
},
                         render : function () {
    var html = [this.samplerButton().$el, this.effectsButton().$el, this.modularButton().$el, this.notesButton().$el];
    return this.$el.html(html);
}
                       };
var ToolsDummyView = { type : 'ToolsDummyView',
                       model : 'app',
                       tagName : 'span',
                       render : function () {
    var html = ['No tool selected.'];
    return this.$el.html(html);
}
                     };
var ToolsSamplerSampleListSampleNameView = { type : 'ToolsSamplerSampleListSampleNameView',
                                             model : 'sample',
                                             init : function (model) {
    return null;
},
                                             render : function () {
    var html = this.sample.name();
    return this.$el.html(html);
}
                                           };
var ToolsSamplerSampleListSampleView = { type : 'ToolsSamplerSampleListSampleView',
                                         model : 'sample',
                                         events : { 'click' : function (e) {
    return this.trigger('select-sample', this.sample);
}, 'dblclick' : function (e) {
    return this.trigger('load-sample', this.sample);
} },
                                         init : function (model) {
    return this.create('name', new View(ToolsSamplerSampleListSampleNameView, model));
},
                                         render : function () {
    var html = this.name().$el;
    return this.$el.html(html);
}
                                       };
var ToolsSamplerSampleListView = { type : 'ToolsSamplerSampleListView',
                                   model : 'samples',
                                   contains : 'ToolsSamplerSampleListSampleView',
                                   init : function (model) {
    return model.each(function (sample) {
        return this.add(new View(ToolsSamplerSampleListSampleView, sample));
    }, this);
},
                                   render : function () {
    var html = this.map(function (sampleListView) {
        return sampleListView.$el;
    });
    return this.$el.html(html);
}
                                 };
var ToolsSamplerSampleView = { type : 'ToolsSamplerSampleView',
                               model : 'sample',
                               render : function () {
    var html = ('Name: ' + this.sample.name()) + '<br/>' + ('URI: ' + this.sample.uri());
    return this.$el.html(html);
}
                             };
var ToolsSamplerView = { type : 'ToolsSamplerView',
                         model : 'app',
                         className : 'ToolsAreaView',
                         init : function (model) {
    this.create('sampleList', new View(ToolsSamplerSampleListView, samples));
    this.create('sample');
    return this.on('select-sample', function (e) {
        this.sample(new View(ToolsSamplerSampleView, e.value));
        return this.render();
    });
},
                         render : function () {
    var html = [this.sampleList().$el, this.sample() ? this.sample().$el : null];
    return this.$el.html(html);
}
                       };
var ToolsEffectsView = { type : 'ToolsEffectsView',
                         model : 'app',
                         className : 'ToolsAreaView',
                         render : function () {
    var html = ['Effects'];
    return this.$el.html(html);
}
                       };
var ToolsModularView = { type : 'ToolsModularView',
                         model : 'app',
                         className : 'ToolsAreaView',
                         render : function () {
    var html = ['Modular'];
    return this.$el.html(html);
}
                       };
var ToolsNotesView = { type : 'ToolsNotesView',
                       model : 'app',
                       className : 'ToolsAreaView',
                       render : function () {
    var el = $('<textarea style=\'width:100%;height:100%\'>');
    return this.$el.html(el);
}
                     };
var ToolsView = { type : 'ToolsView',
                  model : 'app',
                  init : function (model) {
    this.create('openClosePanelButton', new View(ToolsOpenPanelView, this.app));
    this.create('toolsButtons', new View(ToolsButtonsView, this.app));
    this.create('toolsView', new View(ToolsDummyView, this.app));
    this.create('notesView', new View(ToolsNotesView, this.app));
    this.create('samplerView', new View(ToolsSamplerView, this.app));
    this.create('effectsView', new View(ToolsEffectsView, this.app));
    this.create('modularView', new View(ToolsModularView, this.app));
    this.toolsView().$el.css({ display : 'none' });
    this.on('open-tools-panel', function (e) {
        this.toolsView().$el.css({ display : 'inherit' });
        this.openClosePanelButton(new View(ToolsClosePanelView, this.app));
        return this.render();
    });
    this.on('close-tools-panel', function (e) {
        this.toolsView().$el.css({ display : 'none' });
        this.openClosePanelButton(new View(ToolsOpenPanelView, this.app));
        this.toolsButtons().deselect();
        return this.render();
    });
    this.on('open-sampler', function (e) {
        this.toolsView(this.samplerView());
        return this.trigger('open-tools-panel');
    });
    this.on('open-effects', function (e) {
        this.toolsView(this.effectsView());
        return this.trigger('open-tools-panel');
    });
    this.on('open-modular', function (e) {
        this.toolsView(this.modularView());
        return this.trigger('open-tools-panel');
    });
    return this.on('open-notes', function (e) {
        this.toolsView(this.notesView());
        return this.trigger('open-tools-panel');
    });
},
                  render : function () {
    var html = [this.openClosePanelButton().$el, this.toolsButtons().$el, this.toolsView().$el];
    return this.$el.html(html);
}
                };
var MinibufferView = { type : 'MinibufferView',
                       model : 'app',
                       render : function () {
    return this.$el.html('<input class=\'MinibufferEditorView\' type=\'text\'>');
}
                     };
var AppView = { type : 'AppView',
                model : 'app',
                contains : 'SongView',
                init : function (model) {
    this.create('minibuffer', new View(MinibufferView, this.app));
    this.create('tools', new View(ToolsView, this.app));
    this.create('song', new View(SongView, this.app.song()));
    return this.on('load-sample', function (e) {
        return this.song().loadSample(e.value);
    });
},
                render : function () {
    var html = [this.song().$el, this.tools().$el, this.minibuffer().$el];
    return this.$el.html(html);
}
              };
var options = new Class(Options);
var app = new Class(App);
var SoundManager = { type : 'SoundManager',
                     init : function () {
    this.song = app.song();
    this.tempo = this.song.tempo();
    this.mspb = (60 / this.tempo) * 1000;
    this.instruments = this.song.instruments();
    return this.reset();
},
                     reset : function () {
    this.currentTime = 0;
    return this.notes = [];
},
                     note : function (beat, note) {
    var instrument3;
    return this.notes.push((instrument3 = note.instrument(), instrument3 && instrument3 < this.instruments.length ? [beat * this.mspb, this.instruments.at(note.instrument())] : null));
},
                     play : function () {
    return null;
}
                   };
var sm = new Class(SoundManager);
$(document).ready(function () {
    var appView = new View(AppView, app);
    $(document).bind('dblclick', function (e) {
        return e.preventDefault();
    });
    $(document).bind('click', function (e) {
        return !(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') ? $('.MinibufferEditorView').select() : null;
    });
    return $('body').html(appView.$el);
});
