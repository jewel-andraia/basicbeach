var jq = require('node-jq');

const keyRE = /^(.+).|(jq:\/\/\w+)($|\.)/;

async function preprocessor(grammar) {
	const extensions = {};
	for (let key in grammar) {
		const match = keyRE.exec(key);
		if (!match) {
			continue;
		}

		const [_, keyRoot, ref] = match;
		const input = grammar[key];
		const filter = grammar[ref];

		const rawOutput = (await jq.run('.input' + jqFilter, { input }, { input: 'json' , output: 'json' }));
		const output = rawOutput.split('\n').map(x => JSON.parse(x));

		extensions[keyRoot] = output;
	}

	return {
		grammar: {
			...grammar,
			...extensions,
		}
	};
}

module.exports = preprocessor;
