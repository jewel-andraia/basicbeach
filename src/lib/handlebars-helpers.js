const braille = require('braille');

exports.deslug = function deslug(phrase) {
	return !phrase ? phrase : phrase.replace(/[^\w]/g, ' ');
}

exports.braille = function(phrase) {
    return braille.toBraille(phrase.toString());
}