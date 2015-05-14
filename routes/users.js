var User = require('../models/user');

exports.create = function (req, res) {
	var user = new User();

	user.name = req.body.name;
	user.phone = req.body.phone;
	user.email = req.body.email;
	user.photo = req.body.photo;
	user.preferences = req.body.preferences;

	user.token = require('crypto').createHash('sha256').update(user.name + toString(Date.now()) + user.phone + 'pedobear').digest('hex');

	user.save(function (err) {
		if (err) return res.status(400).json({
			error: 'Email already exists'
		});

		res.json({
			token: user.token,
			user: {
				id: user._id,
				name: user.name,
				preferences: user.preferences,
				joined: user.joined
			}
		});
	});
};

exports.fetch = function (req, res) {
	User.findById(req.params.id, function (err, user) {
		if (err) return res.status(500).send(err);

		if (!user) return res.status(404).send({});

		res.send(user);
	});
};

exports.update = function (req, res) {
	if (req.body.photo) req.user.photo = req.body.photo;

	if (req.body.preferences) req.user.preferences = req.body.preferences;

	req.user.save(function (err) {
		if (err) return res.status(500).send(err);

		res.send({});
	});
};

exports.rating = function (req, res) {
	User.findByIdAndUpdate(req.params.id, {
		$push: {
			ratings: {
				user: req.user._id,
				rating: req.body.rating
			}
		}
	}, function (err, model) {
		res.status(err ? 500 : 200).json({});
	});
};

exports.report = function (req, res) {
	User.findByIdAndUpdate(req.params.id, {
		$push: {
			reports: {
				user: req.user._id,
				description: req.body.reason
			}
		}
	}, function (err, user) {
		res.status(err ? 500 : 200).json({});
	});
};

exports.photo = function (req, res) {
	User.findById(req.params.id, function (err, user) {
		if (err) return res.status(400).json({});

		if (!user) return res.status(404);

		if (user.photo) {
			var buffer = new Buffer(user.photo, 'base64');

			res.writeHead(200, {
				'Content-Type': 'image/jpeg',
				'Content-Length': buffer.length
			});

			res.end(buffer);
		} else {
			res.redirect('http://planbear.co/photo/' + user._id);
		}
	});
};