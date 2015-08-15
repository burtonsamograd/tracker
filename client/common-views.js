/* --eval (DEFCONSTANT +DEBUG+ T)
 *//* (DEFVIEW *HEX-VALUE-EDIT-VIEW INIT
       (LAMBDA (MODEL CLASS-NAME MODEL-VALUE-FN WIDTH)
         (SETF (@ THIS MODEL-VALUE-FN) MODEL-VALUE-FN)
         (SETF (@ THIS CLASS-NAME) CLASS-NAME)
         (SETF THIS.WIDTH (OR WIDTH 2))
         (SETF (@ THIS PLACEHOLDER) -)
         (DOTIMES (I (1- (@ THIS WIDTH)))
           (SETF (@ THIS PLACEHOLDER) (+ (@ THIS PLACEHOLDER) -)))
         ((@ THIS END-EDIT)))
       INITIAL-EVENTS (CREATE DBLCLICK (LAMBDA (E) (THIS.EDIT))) EDIT-EVENTS
       (CREATE KEYPRESS
        (LAMBDA (E)
          (IF (= (@ E KEY-CODE) 13)
              (THIS.FINISHED)))
        BLUR (LAMBDA (E) (THIS.FINISHED)))
       EDIT
       (LAMBDA ()
         (LET ((INPUT
                ($
                 (+ <input type='text' maxlength=' THIS.WIDTH ' size='
                    THIS.WIDTH '/>))))
           ((@ INPUT VAL)
            (OR
             (HEX ((@ (@ THIS MODEL-VALUE-FN) CALL) THIS.MODEL) (@ THIS WIDTH))
             ))
           (FOR-IN (EVENT (@ THIS EDIT-EVENTS))
                   ((@ INPUT BIND) EVENT
                    ((@ (GETPROP (@ THIS EDIT-EVENTS) EVENT) BIND) THIS)))
           ((@ THIS $EL HTML) INPUT)
           ((@ INPUT FOCUS))
           ((@ INPUT SELECT))
           (SETF THIS.INPUT INPUT)))
       END-EDIT
       (LAMBDA ()
         ((@ THIS $EL TEXT)
          (OR
           (HEX ((@ (@ THIS MODEL-VALUE-FN) CALL) THIS.MODEL) (@ THIS WIDTH))
           (@ THIS PLACEHOLDER)))
         ((@ THIS $EL ATTR) CLASS (@ THIS CLASS-NAME))
         (FOR-IN (EVENT (@ THIS INITIAL-EVENTS))
                 ((@ THIS $EL BIND) EVENT
                  ((@ (GETPROP (@ THIS INITIAL-EVENTS) EVENT) BIND) THIS)))
         (SETF (@ THIS INPUT) NIL))
       FINISHED
       (LAMBDA (SILENT)
         (LET ((VALUE (PARSE-INT (+ 0x ((@ THIS INPUT VAL))))))
           (UNLESS ((EVAL isNaN) VALUE)
             ((@ THIS MODEL-VALUE-FN CALL) THIS.MODEL VALUE)))
         ((@ THIS END-EDIT)))) */
defview(HexValueEditView, init, function (model, className, modelValueFn, width) {
    this.modelValueFn = modelValueFn;
    this.className = className;
    this.width = width || 2;
    this.placeholder = '-';
    for (var i = 0; i < this.width - 1; i += 1) {
        this.placeholder += '-';
    };
    return this.endEdit();
}, initialEvents, { 'dblclick' : function (e) {
    return this.edit();
} }, editEvents, { 'keypress' : function (e) {
    return e.keyCode === 13 ? this.finished() : null;
}, 'blur' : function (e) {
    return this.finished();
} }, edit, function () {
    var input = $('<input type=\'text\' maxlength=\'' + this.width + '\' size=\'' + this.width + '\'/>');
    input.val(hex(this.modelValueFn.call(this.model), this.width) || '');
    for (var event in this.editEvents) {
        input.bind(event, this.editEvents[event].bind(this));
    };
    this.$el.html(input);
    input.focus();
    input.select();
    return this.input = input;
}, endEdit, function () {
    this.$el.text(hex(this.modelValueFn.call(this.model), this.width) || this.placeholder);
    this.$el.attr('class', this.className);
    for (var event in this.initialEvents) {
        this.$el.bind(event, this.initialEvents[event].bind(this));
    };
    return this.input = null;
}, finished, function (silent) {
    var value = parseInt('0x' + this.input.val());
    if (!eval('isNaN')(value)) {
        this.modelValueFn.call(this.model, value);
    };
    return this.endEdit();
});
/* (DEFVIEW *STRING-VALUE-EDIT-VIEW INIT
    (LAMBDA (MODEL CLASS-NAME MODEL-VALUE-FN WIDTH)
      (SETF (@ THIS MODEL-VALUE-FN) MODEL-VALUE-FN)
      (SETF (@ THIS CLASS-NAME) CLASS-NAME)
      (SETF THIS.WIDTH (OR WIDTH 8))
      (THIS.MODEL.ON 'CHANGE (@ THIS END-EDIT) THIS)
      ((@ THIS END-EDIT)))
    INITIAL-EVENTS (CREATE DBLCLICK (LAMBDA (E) (THIS.EDIT))) EDIT-EVENTS
    (CREATE KEYPRESS
     (LAMBDA (E)
       (IF (= (@ E KEY-CODE) 13)
           (THIS.FINISHED)))
     BLUR (LAMBDA (E) (THIS.FINISHED)))
    EDIT
    (LAMBDA ()
      (LET ((INPUT
             ($
              (+ <input type='text' maxlength=' THIS.WIDTH ' size=' THIS.WIDTH
                 '/>))))
        ((@ INPUT VAL) (OR ((@ (@ THIS MODEL-VALUE-FN) CALL) THIS.MODEL) ))
        (FOR-IN (EVENT (@ THIS EDIT-EVENTS))
                ((@ INPUT BIND) EVENT
                 ((@ (GETPROP (@ THIS EDIT-EVENTS) EVENT) BIND) THIS)))
        ((@ THIS $EL HTML) INPUT)
        ((@ INPUT FOCUS))
        ((@ INPUT SELECT))
        (SETF THIS.INPUT INPUT)))
    END-EDIT
    (LAMBDA ()
      ((@ THIS $EL TEXT) ((@ (@ THIS MODEL-VALUE-FN) CALL) THIS.MODEL))
      ((@ THIS $EL ATTR) CLASS (@ THIS CLASS-NAME))
      (FOR-IN (EVENT (@ THIS INITIAL-EVENTS))
              ((@ THIS $EL BIND) EVENT
               ((@ (GETPROP (@ THIS INITIAL-EVENTS) EVENT) BIND) THIS)))
      (SETF (@ THIS INPUT) NIL))
    FINISHED
    (LAMBDA (SILENT)
      ((@ THIS MODEL-VALUE-FN CALL) THIS.MODEL (OR ((@ THIS INPUT VAL)) --))
      ((@ THIS END-EDIT)))) */
defview(StringValueEditView, init, function (model, className, modelValueFn, width) {
    this.modelValueFn = modelValueFn;
    this.className = className;
    this.width = width || 8;
    this.model.on('change', this.endEdit, this);
    return this.endEdit();
}, initialEvents, { 'dblclick' : function (e) {
    return this.edit();
} }, editEvents, { 'keypress' : function (e) {
    return e.keyCode === 13 ? this.finished() : null;
}, 'blur' : function (e) {
    return this.finished();
} }, edit, function () {
    var input = $('<input type=\'text\' maxlength=\'' + this.width + '\' size=\'' + this.width + '\'/>');
    input.val(this.modelValueFn.call(this.model) || '');
    for (var event in this.editEvents) {
        input.bind(event, this.editEvents[event].bind(this));
    };
    this.$el.html(input);
    input.focus();
    input.select();
    return this.input = input;
}, endEdit, function () {
    this.$el.text(this.modelValueFn.call(this.model));
    this.$el.attr('class', this.className);
    for (var event in this.initialEvents) {
        this.$el.bind(event, this.initialEvents[event].bind(this));
    };
    return this.input = null;
}, finished, function (silent) {
    this.modelValueFn.call(this.model, this.input.val() || '--');
    return this.endEdit();
});
