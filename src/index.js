const tracery = require('tracery-grammar');
const nodescad = require('nodescad');
const seedrandom = require('seedrandom');

/* Constants */
const config = {
	seed: Math.random() * 1000,
	grammar: 't21-tracery-readme', // 'basicbeach',
	nodescad: {
			'binaryPath': '/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD',
			'inputFile': `./src/models/example.scad`,
	},
};

/* Main */

seedrandom(config.seed, { global: true });
const grammar = tracery.createGrammar(require(`./grammar/${config.grammar}.json`));
grammar.addModifiers(tracery.baseEngModifiers);

const text = grammar.flatten('#origin#');

console.log({
	...config,
	text,
});
nodescad.render(config.nodescad, function (result, error) {
	if (error) {
		console.error(error);
	}

	console.log(result);
})
