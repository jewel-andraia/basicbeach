function preprocessor(grammar) {
    return require('./_corpora')(grammar);
}

module.exports = preprocessor;
