const express = require('express');
const exphbs = require('express-handlebars');
const addTrailingSlash = require('connect-slashes');
const nodescad = require('nodescad');
const path = require('path');
const seedrandom = require('seedrandom');
const tracery = require('tracery-grammar');
const url = require('url');

const { contextAwareModifierFactory, environmentFactory } = require('./lib/contextAwareModifiers');
const projectTraceryModifiers = require('./lib/modifiers');
const { loadFileNames } = require('./lib/utils');


const hostname = '127.0.0.1';
const port = 3000;
const grammarDir = path.join(__dirname, 'grammar');

var app = express();

app.use(addTrailingSlash());



app.engine('handlebars', exphbs({
	helpers: {
		'deslug': deslug,
	},
}));
app.set('view engine', 'handlebars');
app.set('views', 'src/views/');

app.get('/tracery', function (req, res) {
	loadFileNames(grammarDir).then(grammars => {
		res.render('index', {
			grammars,
			body_classes: 'index',
		});
	});
});

app.get('/tracery/random', function (req, res) {
	loadFileNames(grammarDir).then(grammars => {
		const grammar = grammars[Math.floor(Math.random() * grammars.length)];
		res.set('location', `/tracery/${grammar}/`);
		res.status(301).send();
	});
});

app.get('/tracery/:grammar', async function (req, res) {
	const reqUrl = url.parse(req.url, true);
	console.log({ reqUrl });
	const grammar = req.params.grammar;
	const seed = parseInt(reqUrl.query.seed, 10) || Math.floor(Math.random() * 999999999);

	console.debug({ reqUrl, grammar });
	try {
		const traceryOutput = await generateTraceryOutput({
			grammar: grammar || 't21-tracery-readme',
			seed,
		});
		console.debug({ ...traceryOutput });
		res.render('grammar-output', {
			...traceryOutput,
			body_classes: 'grammar',
		});
	} catch (e) {
		console.error(e);
		// TODO: error
		res.render('grammar-output', {
			body_classes: 'grammar error',
		});
	}

});


console.log(`Starting server at http://${hostname}:${port}/`);
app.listen(port);

async function generateTraceryOutput(config) {
	/* Generate text */
	if (config.seed) {
		seedrandom(config.seed, { global: true });
	}
	let grammarSource = {
		origin: `No can do ${config.grammar}`,
	};
	try {
		grammarSource = require(`./grammar/${config.grammar}.json`);
	} catch (e) {
		if (e.code !== 'MODULE_NOT_FOUND') {
			throw e;
		}
	}

	const caw = await contextAwareModifierFactory(grammarSource, environmentFactory(config));
	grammarSource = caw.grammarSource;

	const grammar = tracery.createGrammar(grammarSource);
	grammar.addModifiers(tracery.baseEngModifiers);
	grammar.addModifiers(projectTraceryModifiers);
	grammar.addModifiers(caw.modifiers);

	const text = grammar.flatten('#origin#');
	let attribution = grammar.flatten('#_attribution#');
	if (attribution === '((_attribution))') {
		attribution = void 0;
	}

	return {
		config,
		output: {
			text,
			attribution,
		},
	};
}

function deslug(phrase) {
	return !phrase ? phrase : phrase.replace(/[^\w]/g, ' ');
}
