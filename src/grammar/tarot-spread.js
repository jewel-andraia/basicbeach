
function preprocessor(grammar) {
    grammar = require('./_corpora')(grammar);
    grammar = require('./_jq')(grammar);

    return grammar;
}

module.exports = preprocessor;
