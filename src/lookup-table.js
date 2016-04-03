class LookupTable {
    data = {};

    clear() {
        this.data = {};
    }
    set(key, value) {
        this.data[key] = value;
        return value;
    }
    get(key) {
        return this.data[key];
    }
}

// IE8 compatibility output
module.exports = LookupTable;
