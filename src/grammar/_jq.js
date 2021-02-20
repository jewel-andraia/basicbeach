var jq = require('node-jq');

const keyRE = /^(.+)\|jq:(.+)$/;

async function preprocessor(grammar) {
	const extensions = {};
	for (let key in grammar) {
		const match = keyRE.exec(key);
		console.log('jq preprocessor', key, match);
		if (!match) {
			continue;
		}

		const [_, keyRoot, jqFilter] = match;
		const input = grammar[key];
		const rawOutput = (await jq.run('.input' + jqFilter, { input }, { input: 'json' , output: 'json' }));
		console.debug({rawOutput});
		const output = rawOutput.split('\n').map(x => JSON.parse(x));
		extensions[keyRoot] = output;
		console.log('jq', typeof output);
	}

	return {
		...grammar,
		...extensions,
	};
}

module.exports = preprocessor;
