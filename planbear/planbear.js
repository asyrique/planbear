var User = require('../models/user');

exports.auth = function (req, res, next) {
	if (req.headers.token) {
		User.findOne({
			token: req.headers.token
		}, function (err, user) {
			if (err || !user) return res.status(403).json({});

			req.user = user;

			next();
		});
	} else {
		res.status(401).json({});
	}
};

exports.renderTemplate = function (template, data, callback) {
	var fs = require('fs'),
		path = require('path');

	template = path.join(__dirname, '..', 'assets', template + '.html');

	fs.readFile(template, function (err, template) {
		if (err) return;

		html = template.toString();

		Object.keys(data).forEach(function (key) {
			if (html.indexOf(key) >= 0) {
				html = html.replace(new RegExp('{{' + key + '}}', 'g'), data[key]);
			}

		});

		if (typeof callback === 'function') {
			callback(html);
		}

	});
};