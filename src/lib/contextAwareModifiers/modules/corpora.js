var corpora = require('corpora-project');

async function data(key, specification, context) {
    if (!specification.path) {
        throw new Error(`corpora: no path specified for ${key}`);
    };

    const match = specification.path;
    const corporaData = 
        corpora.getFile(match[0], match[1])[match[2]]
    || corpora.getFile(match[0], match[1])[match[0]]
    || corpora.getFile(match[0], match[1])[match[1]]
    || corpora.getFile(match[0], match[1], match[2])[match[2]]
    || corpora.getFile(match[0], match[1], match[2])[match[3]]
    || corpora.getFile(match[0], match[1], match[2])[match[0]]
    || corpora.getFile(match[0], match[1], match[2])[match[1]]
		;

    if (!corporaData) {
        throw new Error(`corpora: no corpora-project found for ${match}`);
    }

    return corporaData.flat();
}


module.exports = {
    data,
};
