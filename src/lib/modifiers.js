const emojiUnicode = require("emoji-unicode");

const htmlEntity = exports.htmlEntity = function(s) {
	return emojiUnicode(s).split(' ').map(u => `&\\#x${u};`).join('');
};


