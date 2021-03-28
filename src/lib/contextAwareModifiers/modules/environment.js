function data(key, specification, environment) {
    const res = environment[specification.key];
    if (typeof res === "undefined") {
        throw new Error(`context: could not load ${specification.key} for ${key}`);
    }

    return res;
}


module.exports = {
    data,
};