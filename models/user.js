var mongoose = require('mongoose');

var schema = new mongoose.Schema({
	name: String,
	email: {
		type: String,
		unique: true,
		select: false
	},
	phone: {
		type: String,
		unique: true,
		select: false
	},
	sponsor: {
		type: Boolean,
		default: false
	},
	photo: {
		type: String,
		select: false
	},
	joined: {
		type: Date,
		default: Date.now
	},
	token: {
		type: String,
		unique: true,
		select: false
	},
	preferences: [String],
	ratings: [
		{
			user: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			},
			rating: Number,
			time: {
				type: Date,
				default: Date.now
			}
        }
    ],
	reports: [
		{
			user: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			},
			description: String,
			time: {
				type: Date,
				default: Date.now
			}
        }
    ]
});

schema.set('toJSON', {
	transform: function (doc, ret, options) {
		ret.id = ret._id;

		delete ret._id;
		delete ret.__v;

		delete ret.phone;
		delete ret.email;
		delete ret.token;
		delete ret.reports;

		if (ret.ratings) {
			ret.ratings = ret.ratings.reduce(function (rating, item) {
				return rating + item.rating;
			}, 0);
		}
	}

});

module.exports = mongoose.model('User', schema);