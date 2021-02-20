const express = require('express');
const exphbs  = require('express-handlebars');
const addTrailingSlash = require('connect-slashes');
const fs = require('fs');
const nodescad = require('nodescad');
const path = require('path');
const seedrandom = require('seedrandom');
const tracery = require('tracery-grammar');
const url = require('url');

const projectTraceryModifiers = require('./lib/modifiers');


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

app.get('/tracery', function(req, res) {
	new Promise((resolve, reject) => {
		fs.readdir(grammarDir, function(err, files) {
			if (err) {
				reject(err);
			}

		 const grammars = Array.from(new Set(files.map(x => x.split('.')[0])))
				.filter(x => x[0] !== '_')
				.filter(x => x);

			resolve(grammars);
		});
	}).then(grammars => {
		res.render('index', {
			grammars,
		});
	});
});

app.get('/tracery/:grammar', async function(req, res)  {
				const reqUrl = url.parse(req.url, true);
				console.log({ reqUrl });
				const grammar = req.params.grammar;
				const seed = parseInt(reqUrl.query.seed, 10) || Math.floor(Math.random() * 999999999);

				console.debug({ reqUrl, grammar });
				const traceryOutput = await generateTraceryOutput({
						grammar: grammar || 't21-tracery-readme',
						seed,
				});
				console.debug({ ...traceryOutput });
				res.render('grammar-output', {
						...traceryOutput,	
						});
				});



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
		let grammarPreprocessor = x => x;
		try {
				grammarPreprocessor = require(`./grammar/${config.grammar}.js`);
		} catch (e) {
				if (e.code !== 'MODULE_NOT_FOUND') {
						console.error('Grammar preprocessor failed', e);
						throw e;
				}
		}
		
		const preprocessed = await grammarPreprocessor(grammarSource);
		if (!preprocessed.grammar) {
			grammarSource = preprocessed;
		}
		if (preprocessed.grammar) {
			grammarSource = preprocessed.grammar;
		}
		const grammar = tracery.createGrammar(grammarSource);
		grammar.addModifiers(tracery.baseEngModifiers);
		grammar.addModifiers(projectTraceryModifiers);
		if (preprocessed.modifiers) {
			grammar.addModifiers(preprocessed.modifiers);
		}
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
