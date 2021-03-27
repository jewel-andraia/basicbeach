var jq = require('node-jq');

async function filter(key, specification, data, context) {
    const jqPath = specification.jqPath;
    const rawOutput = (await jq.run(
        '.input' + jqPath, 
        { input: data }, 
        { input: 'json' , output: 'json' },
    ));
    console.debug({rawOutput});
    const output = rawOutput.split('\n').map(x => JSON.parse(x));
    console.log('jq', typeof output);

    return output;
}

module.exports = {
    filter,
};