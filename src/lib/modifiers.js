const emojiUnicode = require("emoji-unicode");

const repeat = exports.repeat = function (s, [countString]) {
	let count = parseInt(countString);
	if (isNaN(count)) {
		count = 1;
	}

	const result = new Array(count).fill(s).join('');
	console.log({ count, countString, result });
	return result;
}

const htmlEntity = exports.htmlEntity = function(s) {
	return emojiUnicode(s).split(' ').map(u => `&\\#x${u};`).join('');
};

const possessive = exports["'s"] = function(s) {
	switch (s.substr(s.length - 1)) {
		case 's':
		  return s + "'";
		default:
			return s + "'s";
	}
}

const ordinal = exports.ordinal = function(s) {
	switch (s.substr(s.length - 1)) {
		case "1": {
			return s + 'st';
		}
		case "2": {
			return s + 'nd';
		}
		case "3": {
			return s + 'rd';
		}
		case "4":
		case "5":
		case "6":
		case "7":
		case "8":
		case "9":
		case "0":
		{
			return s + 'th';
		}
		default:
			return s;
	};
};

const replaceInitial = exports.replaceInitial = function(s, [replacer]) {
	return s.replace(/\b[A-Z](\w+)\b/g, `${replacer}$1`); 	
};

const replaceInitialConsonant = exports.replaceInitialConsonant = function(s, [replacer]) {
	return s.replace(/\b[BCDFGHJKLMNPQRSTVWXZ](\w+)\b/g, `${replacer}$1`); 	
};

const ing = exports.ing = function(s) {
	// gerund
	return s.replace(/e?$/, 'ing');
}

const es = exports.es = function(s) {
	if (s.endsWith('s')) {
		return s;
	} else {
		return `${s}s`;
	}
}

const no_es = exports.no_es = function(s) {
	if (
		s.toLowerCase().endsWith('series') ||
		s.toLowerCase().endsWith('ces')
	) {
		return s;
	}
	if (s.toLowerCase().endsWith('movies')) {
		return s.replace(/s$/, '');
	}
	if (s.toLowerCase().endsWith('ies')) {
		return s.replace(/ies$/, 'y');
	}

	return s.replace(/e?s$/, '');
}

const lowercase = exports.lowercase = function(s) {
	return s.toLowerCase();
}