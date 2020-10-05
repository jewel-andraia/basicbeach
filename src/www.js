const express = require('express');
const exphbs  = require('express-handlebars');
const http = require('http');
const nodescad = require('nodescad');
const seedrandom = require('seedrandom');
const tracery = require('tracery-grammar');
const url = require('url');

const projectTraceryModifiers = require('./lib/modifiers');


const hostname = '127.0.0.1';
const port = 3000;

var app = express();

app.engine('handlebars', exphbs({
	helpers: {
			'deslug': deslug,
	},
}));
app.set('view engine', 'handlebars');
app.set('views', 'src/views/');

/*- Helpers -*/

app.get(/^\/(?:\w+)(?:\/([\w\-]+))?/, function(req, res)  {
				const reqUrl = url.parse(req.url, true);
				console.log({ reqUrl });
				const path = reqUrl.path.match(/^\/(?<prefix>\w+)(?:\/(?<grammar>[\w\-]+))?/);
				const grammar = path && path.groups.grammar;
				const seed = parseInt(reqUrl.query.seed, 10) || Math.floor(Math.random() * 999999999);

				console.debug({ reqUrl, grammar });
				const traceryOutput = generateTraceryOutput({
						grammar: grammar || 't21-tracery-readme',
						seed,
				});
				console.debug({ ...traceryOutput });
				res.render('home', {
						...traceryOutput,	
						});
				});


app.listen(port);

function generateTraceryOutput(config) {
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
						throw e;
				}
		}

		const grammar = tracery.createGrammar(grammarPreprocessor(grammarSource));
		grammar.addModifiers(tracery.baseEngModifiers);
		grammar.addModifiers(projectTraceryModifiers);
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
