

function preprocessor(grammar) {
    for (let x of 'abcdefghijklmnopqrstuvwxy'.split('')) {
        grammar["Verb Verb Verb"].push(`#verb-x# #verb-x# #verb-x#`);
        grammar[`verb-${x}`] = [`${x}ive`, `${x}augh`, `${x}ove`];
    }
    return grammar;
}

module.exports = preprocessor;