const tracery = require('tracery-grammar');
const nodescad = require('nodescad');
const seedrandom = require('seedrandom');
const fs = require('fs');
const yargs = require('yargs');

/* Config */
const argv = yargs.options({
	seed: {
		alias: 's',
		describe: 'random seed for tracery',
		default: Math.floor(Math.random() * 1000),
	},
	grammar: {
		alias: 'g',
		describe: 'basename for tracery grammar',
		default: 't21-tracery-readme', // 'basicbeach',
	},
	scad: {
		alias: 'm',
		describe: 'basename for openscad script',
		default: 'example', // 'basicbeach',
	},
	scadPath: {
		describe: 'path to openscad scripts',
		default: 'src/models',
	},
}).argv;

const config = {
	...argv,
	nodescad: {
		binaryPath: '"/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD"',
		render: true,
	},
	variables: {
	},
};
console.error(config);

/* Calculated constants */
const outputPath = `${process.cwd()}/output/${config.grammar}/${config.scad}/${config.seed}/${config.grammar} - ${config.scad} - ${config.seed} - ${Date.now()}`;
const outputBasename = `${config.grammar} - ${config.scad} - ${config.seed}`;

/* Prepare output files */
fs.mkdirSync(outputPath, { recursive: true });
fs.writeFileSync(`${outputPath}/config - ${outputBasename}.json`, JSON.stringify(config, undefined, 2));

/* Generate text */
seedrandom(config.seed, { global: true });
const grammar = tracery.createGrammar(require(`./grammar/${config.grammar}.json`));
grammar.addModifiers(tracery.baseEngModifiers);
const text = grammar.flatten('#origin#');

/* Render scad script + text into stl scad and png preview */ 
const stlOptions = {
	inputFile: `"${process.cwd()}/${config.scadPath}/${config.scad}.scad"`,
	...config.nodescad,
	variables: {
		inputText: text,
		...config.variables,
	},
	format: 'stl',
	outputFile: `"${outputPath}/stl - ${outputBasename}.stl"`,
};
const pngOptions = {
	inputFile: `"${process.cwd()}/${config.scadPath}/${config.scad}.scad"`,
	...config.nodescad,
	variables: {
		inputText: text,
		...config.variables,
	},
	format: 'png',
	outputFile: `"${outputPath}/png - ${outputBasename}.png"`,
};

nodescad.render(stlOptions, function (error, result) {
	const options = stlOptions;
	if (error || result && result.error) {
		console.error({ 
			options,
			error,
			result,
		});
	}
});

nodescad.render(pngOptions, function (error, result) {
	const options = pngOptions;
	if (error || result && result.error) {
		console.error({ 
			options,
			error,
			result,
		});
	}
});

// TODO: await all nodescad render 

/* Ding, fries are done. */
console.log(outputPath);