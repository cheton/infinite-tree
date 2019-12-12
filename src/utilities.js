export const trim = (str, chars = ' \f\n\r\t\v') => {
    while (chars.indexOf(str[0]) >= 0) {
        str = str.slice(1);
    }
    while (chars.indexOf(str[str.length - 1]) >= 0) {
        str = str.slice(0, -1);
    }
    return str;
};

// Use this function instead of Array.prototype.splice(...) as it results into
// "Maximum call stack size exceeded" when dealing with very big number.
export const spliceArray = (target, source, start, count) => {
    let res = target.splice(start, count);

    if (source && source.length) {
        for (let idx = Math.floor(source.length / 10000); idx >= 0; idx--) {
            target.splice.apply(target, [start, 0].concat(
                source.slice(idx * 10000, (idx + 1) * 10000)
            ));
        }
    }
    return res;
};

export const get = (function() {
    const re = new RegExp(/[\w\-]+|\[[^\]]*\]+/g);

    return (object, path, defaultValue) => {
        if (!object || typeof object !== 'object') {
            return defaultValue;
        }

        path = '' + path;

        const keys = path.match(re);
        if (!keys) {
            return defaultValue;
        }

        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            key = trim(key, ' \f\n\r\t\v');
            if (key[0] === '[') {
                key = trim(key.slice(1, -1), ' \f\n\r\t\v');
            }
            key = trim(key, '\'"');

            if ((object === undefined) || (object === null) || typeof object !== 'object') {
                break;
            }

            object = object[key];

            if (object === undefined) {
                break;
            }
        }

        return (object !== undefined) ? object : defaultValue;
    };
}());
