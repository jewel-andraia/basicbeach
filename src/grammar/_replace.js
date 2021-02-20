var jq = require('node-jq');

const keyRE = /^replace:\/\/.+$/;

const replace = key => grammar => s => {
	const spec = grammar[key];
	const regexp = new RegExp(spec[0], spec[2]);
	const newSubstr = spec[1];

	const result = s.replace(regexp, newSubstr);
	return result;
}

function preprocessor(grammar) {
	const modifiers = {};

	for (let key in grammar) {
		const match = keyRE.exec(key);
		if (!match) {
			continue;
		}

		modifiers[key] = replace(key)(grammar);
	}

	return {
		modifiers,
	};
}

module.exports = preprocessor;
