async function data(key, specification, context) {
    return {};
}

async function filter(key, specification, data, context) {
    return data;
};

function modifier(input, context, key, specification) {
    return input;
}

async function preprocess(grammarSource, context, key, specification) {
    return grammarSource;
}

module.exports = {
    data,
    filter,
    modifier,
    preprocess,
};