class LookupTable {
    data = {};

    clear() {
        this.data = {};
    }
    get(key) {
        return this.data[key];
    }
    has(key) {
        return this.data[key] !== undefined;
    }
    set(key, value) {
        this.data[key] = value;
        return value;
    }
    unset(key) {
        if (this.data[key] !== undefined) {
            delete this.data[key];
        }
    }
}

export default LookupTable;
