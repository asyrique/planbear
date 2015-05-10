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