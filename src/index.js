const tracery = require('tracery-grammar');

const grammarSrc = 't21-tracery-readme'; // 'basicbeach';
const grammar = tracery.createGrammar(require(`./grammar/${grammarSrc}.json`));

grammar.addModifiers(tracery.baseEngModifiers);
console.log(grammar.flatten('#origin#'));

