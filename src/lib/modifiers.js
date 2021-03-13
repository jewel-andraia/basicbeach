const emojiUnicode = require("emoji-unicode");

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

