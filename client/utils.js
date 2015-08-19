
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
