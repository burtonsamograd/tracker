/* --eval (DEFCONSTANT +DEBUG+ T)
 *//* (DEFVIEW *TWO-CHARACTER-HEX-VALUE-EDIT-VIEW TAG-NAME
       input type='text' maxlength='2' size='2' INIT
       (LAMBDA (MODEL MODEL-VALUE-FN)
         (SETF (@ THIS MODEL-VALUE-FN) MODEL-VALUE-FN)
         (THIS.$EL.VAL
          ((@ (OR ((@ MODEL-VALUE-FN CALL) THIS.MODEL) ) TO-STRING) 16)))
       EVENTS
       (CREATE KEYPRESS
        (LAMBDA (E)
          (IF (= (@ E KEY-CODE) 13)
              (THIS.FINISHED)))
        BLUR (LAMBDA (E) (THIS.FINISHED)))
       FINISHED
       (LAMBDA ()
         (LET ((VALUE (PARSE-INT (+ 0x (THIS.$EL.VAL)))))
           (UNLESS ((EVAL isNaN) VALUE)
             ((@ THIS MODEL-VALUE-FN CALL) THIS.NOTE VALUE)))
         (THIS.TRIGGER END-EDIT THIS))
       RENDER (LAMBDA () THIS.$EL)) */
defview(TwoCharacterHexValueEditView, tagName, 'input type=\'text\' maxlength=\'2\' size=\'2\'', init, function (model, modelValueFn) {
    this.modelValueFn = modelValueFn;
    return this.$el.val((modelValueFn.call(this.model) || '').toString(16));
}, events, { 'keypress' : function (e) {
    return e.keyCode === 13 ? this.finished() : null;
}, 'blur' : function (e) {
    return this.finished();
} }, finished, function () {
    var value = parseInt('0x' + this.$el.val());
    if (!eval('isNaN')(value)) {
        this.modelValueFn.call(this.note, value);
    };
    return this.trigger('end-edit', this);
}, render, function () {
    return this.$el;
});
