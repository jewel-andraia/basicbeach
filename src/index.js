const tracery = require('tracery-grammar');
const nodescad = require('nodescad');
const seedrandom = require('seedrandom');
const fs = require('fs');

/* Config */
const config = {
	seed: Math.floor(Math.random() * 1000),
	grammar: 't21-tracery-readme', // 'basicbeach',
	model: 'example', // 'basicbeach',
	modelPath: './src/models',
	nodescad: {
		binaryPath: '/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD',
		render: true,
	},
	variables: {
	},
};

/* Calculated constants */
const outputPath = `${process.cwd()}/output/${config.grammar}/${config.model}/${config.seed}/${config.grammar} - ${config.model} - ${config.seed} - ${Date.now()}`;
const outputFilenameStub = `${config.grammar} - ${config.model} - ${config.seed}`;

/* Prepare output files */
fs.mkdirSync(outputPath, { recursive: true });
fs.writeFileSync(`${outputPath}/config - ${config.grammar} - ${config.model} - ${config.seed}.json`, JSON.stringify(config, undefined, 2));

/* Generate text */
seedrandom(config.seed, { global: true });
const grammar = tracery.createGrammar(require(`./grammar/${config.grammar}.json`));
grammar.addModifiers(tracery.baseEngModifiers);
const text = grammar.flatten('#origin#');

/* Render scad script + text into stl model andpng */
const nodescadOptions = {
	...config.nodescad,
	inputFile: `"${config.modelPath}/${config.model}.scad"`,
	/*
	variables: {
		...config.variables,
		text,
	}
	*/
};
const stlOptions = {
	... nodescadOptions,
	format: 'stl',
	outputFile: `"${outputPath}/stl - ${outputFilenameStub}.stl"`
};
const pngOptions = {
	...nodescadOptions,
	format: 'png',
	outputFile: `"${outputPath}/png - ${outputFilenameStub}.png"`
};

nodescad.render(stlOptions, function (err, result) {
	if (err || result.stderr) {
		throw err || result.stderr;
	}
});
nodescad.render(pngOptions, function (err, result) {
	if (err || result.stderr) {
		throw err || result.stderr;
	}
});

/* Ding, fries are done. */
console.info({
	config,
	outputPath,
});