const { parse, evaluate } = require('groq-js');

const keyRE = /^(.+)\.(groq:\/\/\w+)($|\.)/;

async function preprocessor(grammar) {
	const extensions = {};
	for (let key in grammar) {
		const match = keyRE.exec(key);
		if (!match) {
			continue;
		}

		const [_, keyRoot, ref] = match;
		const tree = parse(grammar[ref]);

		const dataset = grammar[key];

		const value = await evaluate(tree, {dataset});
		const result = value.get();

		extensions[keyRoot] = value;
	}

	return {
		grammar: {
			...grammar,
			...extensions,
		},
	};
}

module.exports = preprocessor;
