
var corpora = require('corpora-project');

const corporaRE = /^corpora-(\w+)-([\w_]+)(?:-([\w_]+))?$/;

function preprocessor(grammar) {
    for (let key in grammar) {
        const match = corporaRE.exec(key);
        if (match) {
            grammar[key] = corpora.getFile(match[1], match[2])[match[3]]
		|| corpora.getFile(match[1], match[2])[match[1]]
		|| corpora.getFile(match[1], match[2])[match[2]]
	    if (!grammar[key]) {
		console.error(" couldn't find a corpora-projects match for", match);
		}
        }
    }

    return grammar;
}

module.exports = preprocessor;
