/* --eval (DEFCONSTANT +DEBUG+ T)
 *//* (DEFUN HEX (X LEN)
        (SETF LEN (OR LEN 2))
        (WHEN (= (TYPEOF X) 'NUMBER)
          (LET ((S ((@ X TO-STRING) 16)))
            (WHEN (< S.LENGTH LEN)
              (DOTIMES (I (+ 1 (- LEN S.LENGTH))) (SETF S (+ '0 S))))
            S))) */
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
