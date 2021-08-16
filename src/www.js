const express = require('express');
const exphbs = require('express-handlebars');
const addTrailingSlash = require('connect-slashes');
const path = require('path');
const seedrandom = require('seedrandom');
const tracery = require('tracery-grammar');
const url = require('url');

const brackets = require('./lib/brackets');
const handlebarsHelpers = require('./lib/handlebars-helpers');
const projectTraceryModifiers = require('./lib/modifiers');
const { loadFileNames } = require('./lib/utils');

const { contextAwareModifierFactory, environmentFactory } = !(function() {
   try {
     return require('./lib/contextAwareModifiers');
   } catch (e) {
     console.error('Could not load contextAwareModifiers', e);
     return {};
   }
})();

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;
const rootPath = "/tracery/" 
const grammarDir = path.join(__dirname, 'grammar');

var app = express();

app.use(addTrailingSlash());



app.engine('handlebars', exphbs({
	helpers: handlebarsHelpers,
}));
app.set('view engine', 'handlebars');
app.set('views', 'src/views/');

if (rootPath !== '/') {
  app.get('/', function(req, res) {
    res.set('location', rootPath);
		res.status(301).send();
  });
}
app.get(rootPath, function (req, res) {
	loadFileNames(grammarDir).then(grammars => {
		res.render('index', {
			grammars,
			body_classes: 'index',
		});
	});
});

app.get(`${rootPath}random`, function (req, res) {
	loadFileNames(grammarDir).then(grammars => {
		const grammar = grammars[Math.floor(Math.random() * grammars.length)];
		res.set('location', `/tracery/${grammar}/`);
		res.status(301).send();
	});
});

app.get(`${rootPath}:grammar`, async function (req, res) {
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


console.log(`Starting server at http://${hostname}:${port}${rootPath}`);
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

  let caw;
  if (contextAwareModifierFactory) {
    caw = await contextAwareModifierFactory(grammarSource, environmentFactory(config));
  	grammarSource = caw.grammarSource;
  }

	const grammar = tracery.createGrammar(grammarSource);
	grammar.addModifiers(tracery.baseEngModifiers);
	grammar.addModifiers(projectTraceryModifiers);
  if (caw) { grammar.addModifiers(caw.modifiers); }

	const origin = grammar.flatten('#origin#');
	const text = brackets.removeBrackets(origin);

	const imageTags = brackets.matchBrackets(origin);
	const images = imageTags && imageTags.map(match => {
		match = match.replace(/\\{/g, "{").replace(/\\}/g, "}");

		if (match.startsWith('{svg ')) {
			return match.substr(5, match.length - 6);
		} else if (match.startsWith('{img ')) {
			return `<img src="${match.substr(5, match.length - 6)}" />`;
		}

		const error = new Error("Could not find filter");
		error.value = match;
		throw error;
	});

	let attribution = grammar.flatten('#_attribution#');
	if (attribution === '((_attribution))') {
		attribution = void 0;
	}

	return {
		config,
		output: {
			text,
			images,
			attribution,
		},
	};
}
