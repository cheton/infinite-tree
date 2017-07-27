const re = new RegExp(/[\w\-]+|\[[^\]]*\]+/g);

const get = function(object, path, defaultValue) {
    if (!object || typeof object !== 'object') {
        return defaultValue;
    }

    // Ensure string
    path = '' + path;

    const keys = path.match(re);
    if (!keys) {
        return defaultValue;
    }

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i].trim();
        if (['\'', '"', '[', ']'].indexOf(key.charAt(0)) >= 0) {
            key = key.slice(1, -1);
        }
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

export default get;
