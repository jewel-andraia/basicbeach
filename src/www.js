const express = require('express');
const nodescad = require('nodescad');
const seedrandom = require('seedrandom');
const tracery = require('tracery-grammar');
const url = require('url');

const projectTraceryModifiers = require('./lib/modifiers');


const hostname = '127.0.0.1';
const port = 3000;

const app = express();

app.get('/', (req, res) => {
	res.send('Bespoke tracery project by andytuba');
});

app.param('grammar', (req, res, next, value, name) => {
	let source = {};
	try {
		const source = require(`./grammar/${value}.json`);
	} catch (e) {
		if (e.code === 'MODULE_NOT_FOUND') {
			return next(createError(404, `can't speak ${value}`));
		}
	}
	let transform = x => x;
	try {
		transform = require(`./grammar/${value}.js`);
	} catch (e) {
		if (e.code !== 'MODULE_NOT_FOUND') {
			return next(createError(500, `error running preprocessor for ${value}`);
		}
	}
	const grammar = transform(source);
	req.params[name] = grammar;
	return next();
});

app.get('/
	try {
		const reqUrl = url.parse(req.url, true);
		console.log({ reqUrl });
		const path = reqUrl.path.match(/^\/(?<prefix>\w+)(?:\/(?<grammar>[\w\-]+))?/);
		const grammar = path && path.groups.grammar;
		const seed = parseInt(reqUrl.query.seed, 10) || Math.floor(Math.random() * 999999999);

		console.debug({ reqUrl, grammar });

		


		let html = '<html>honk';
		try {
			html = traceryHtml({ grammar, seed });
		} catch (err) {
			if (err.code === 'MODULE_NOT_FOUND') {
				res.statusCode = 404;
				res.setHeader('Content-Type', 'text/plain');
				res.end(`No can do ${grammar}`);
				return;
			}
			throw err;
		}

		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/html');
	  	res.end(html);
	} catch (err) {
		console.error({ url: req.url, err });
		res.statusCode = 503;
		res.setHeader('Content-Type', 'text/plain');
		res.end(JSON.stringify({ err }, 4));
	}
});

app.listen(port, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});

function traceryHtml({ grammar = '', seed }) {
	const traceryOutput = generateText({
		grammar: grammar || 't21-tracery-readme',
		seed,
	});
	console.debug( traceryOutput );
	html = `
<html>
	<head>
		<title>/tracery/${grammar}</title>
		<style>
			html {
				background-color: cornflowerblue;
				color: antiquewhite;
				font-size: 5vw;
			}
			body {
				padding: 3%;
			}

			h1 {
				font-family: sans-serif;
				font-style: oblique;
				font-size: .8rem;
				text-align: right;
				text-transform: capitalize;
			}
			a {
				color: inherit;
				text-decoration: none;
			}

			content {
				font-family: serif;	
				font-size: 1rem;
				width: 80%;
				white-space: pre-wrap;
			}


			footer {
				font-size: .5rem;
				text-align: right;
			}

		</style>
	</head>
	<body>
		<h1><a href="?">${deslug(grammar)}</a> <a href="?seed=${traceryOutput.config.seed}">&#x1f517;</a></h1>
		<content>${traceryOutput.output.text}</content>
		<footer><a href="https://github.com/andytuba/basicbeach" target="_blank">a tracery project</a> by <a href="https://twitter.com/andytuba" target="_blank">@andytuba</a></footer>
	</body>
</html>
	`;
	return html;
}

function generateText(config) {
	/* Generate text */
	if (config.seed) {
		seedrandom(config.seed, { global: true });
	}
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
	grammar.addModifiers(projectTraceryModifiers);
	const text = grammar.flatten('#origin#');

	return {
		config,
		output: {
			text,
		},
	};
}

function deslug(phrase) {
	return phrase.replace(/[^\w]/g, ' ');
}
