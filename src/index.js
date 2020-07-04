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
		type: 'number',
		default: Math.floor(Math.random() * 1000),
	},
	grammar: {
		alias: 'g',
		describe: 'basename for tracery grammar',
		type: 'string',
		default: 't21-tracery-readme', // 'basicbeach',
	},
	scad: {
		alias: 'm',
		describe: 'basename for openscad script',
		type: 'string',
		default: 'words-in-a-box',
	},
	scadPath: {
		describe: 'path to openscad scripts',
		type: 'string',
		default: 'src/models',
	},
	stl: {
		describe: 'render the STL file',
		type: 'boolean',
		default: false,
	},
	png: {
		describe: 'render the png file',
		type: 'boolean',
		default: true,
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

/* Calculated constants */
const outputPath = `${process.cwd()}/output/${config.grammar}/${config.scad}/${config.seed}/${config.grammar} - ${config.scad} - ${config.seed} - ${Date.now()}`;
const outputBasename = `${config.grammar} - ${config.scad} - ${config.seed}`;

/* Prepare output files */
fs.mkdirSync(outputPath, { recursive: true });
fs.writeFileSync(`${outputPath}/config - ${outputBasename}.json`, JSON.stringify(config, undefined, 2));

/* Generate text */
seedrandom(config.seed, { global: true });
const grammarSource = require(`./grammar/${config.grammar}.json`);
let grammarPreprocessor = x => x;
try {
	grammarPreprocessor = require(`./grammar/${config.grammar}.js`);
} catch (e) {
	if (e.code !== 'MODULE_NOT_FOUND') {
		throw e;
	}
}

const grammar = tracery.createGrammar(grammarPreprocessor(grammarSource));
grammar.addModifiers(tracery.baseEngModifiers);
const text = grammar.flatten('#origin#');
fs.writeFileSync(`${outputPath}/text - ${outputBasename}.txt`, text);


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
	imageSize: {
		x: 1000,
		y: 1000,
	},
	autoCenter: true,
	projection: 'orthogonal',
	colorSchema: 'Sunset',
	format: 'png',
	outputFile: `"${outputPath}/png - ${outputBasename}.png"`,
};

if (config.stl)
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

if (config.png)
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