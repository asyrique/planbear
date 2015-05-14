var mongoose = require('mongoose');

var schema = new mongoose.Schema({
	creator: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	type: {
		type: String,
		index: true
	},
	location: {
		type: [Number], // [<longitude>, <latitude>]
		index: '2d' // create the geospatial index
	},
	description: String,
	sponsored: Boolean,
	created: {
		type: Date,
		default: Date.now
	},
	participants: [
		{
			joined: {
				type: Date,
				default: Date.now
			},
			user: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			}
        }
    ],
	comments: [
		{
			user: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			},
			body: String,
			created: {
				type: Date,
				default: Date.now
			},
			auto: {
				type: Boolean,
				default: false
			}
        }
    ],
	removed: [String]
});

schema.set('toJSON', {
	transform: function (doc, ret, options) {
		ret.id = ret._id;

		if (ret.location) {
			ret.location = {
				latitude: ret.location[1],
				longitude: ret.location[0]
			};
		}

		if (ret.comments) ret.comments = ret.comments.length;

		if (ret.participants) ret.participants = ret.participants.length + 1;

		delete ret._id;
		delete ret.__v;
	}
});

module.exports = mongoose.model('Plan', schema);