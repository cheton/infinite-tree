export const trim = (str, chars = ' \f\n\r\t\v') => {
    while (chars.indexOf(str[0]) >= 0) {
        str = str.slice(1);
    }
    while (chars.indexOf(str[str.length - 1]) >= 0) {
        str = str.slice(0, -1);
    }
    return str;
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
