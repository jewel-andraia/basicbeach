async function data(key, specification, context) {
    return {};
}

function modifier(input, context, key, specification) {
    return input;
}

async function preprocess(grammarSource, context, key, specification) {
    return grammarSource;
}

module.exports = {
    data,
    modifier,
    preprocess,
};