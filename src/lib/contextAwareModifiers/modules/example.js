async function data(key, specification, context) {
    return {};
}

function modifier(input, environment, key, specification) {
    return input;
}

async function preprocess(grammarSource, environment, key, specification) {
    return grammarSource;
}

module.exports = {
    data,
    modifier,
    preprocess,
};