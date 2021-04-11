const fs = require('fs');

exports.loadFileNames = function loadFileNames(dir) {
	return new Promise((resolve, reject) => {
		fs.readdir(dir, function (err, files) {
			if (err) {
				reject(err);
			}

			const validFilenames = Array.from(new Set(files.map(x => x.split('.')[0])))
				.filter(x => x[0] !== '_')
				.filter(x => x);

			resolve(validFilenames);
		});
    });
};