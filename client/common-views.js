
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
