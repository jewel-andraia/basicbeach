
var corpora = require('corpora-project');

const corporaRE = /^corpora-(\w+)-(\w+)$/;

function preprocessor(grammar) {
    for (let key in grammar) {
        const match = corporaRE.exec(key);
        if (match) {
            grammar[key] = corpora.getFile(match[1], match[2])[match[1]];
        }
    }

    return grammar;
}

module.exports = preprocessor;