const tracery = require('tracery-grammar');
const nodescad = require('nodescad');
const seedrandom = require('seedrandom');

const http = require('http');
const url = require('url');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
	try {
		const reqUrl = url.parse(req.url, true);
		console.log({ reqUrl });
		const path = reqUrl.path.match(/^\/(?<prefix>\w+)(?:\/(?<grammar>[\w\-]+))?/);
		const grammar = path && path.groups.grammar || 't21-tracery-readme';

		console.debug({ reqUrl, grammar });
		let html = '<html>honk';
		try {
			const traceryOutput = generateText({
			      grammar,
			});
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

						pre {
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
					<h1><a href="${req.url}">${deslug(grammar)}</a></h1>
					<pre>${traceryOutput}</pre>
					<footer>nonsense provided by <a href="https://twitter.com/andytuba">@andytuba</a></footer>
				</body>
			</html>
				`;
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

server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});

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
	const text = grammar.flatten('#origin#');

	return text;
}

function deslug(phrase) {
	return phrase.replace(/[^\w]/g, ' ');
}
