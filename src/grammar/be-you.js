
function preprocessor(grammar) {
    grammar = require('./_corpora')(grammar);

    return grammar;
}

module.exports = preprocessor;