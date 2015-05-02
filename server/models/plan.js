var mongoose = require('mongoose');
 
var schema = new mongoose.Schema(
{
    creator:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String, // Look into using enum for this in the future. (food, drinks, movies, clubbing, outdoors)
        index: true
    },
    location:
    {
        type: [Number],  // [<longitude>, <latitude>]
        index: '2d'      // create the geospatial index
    },
    description: String,
    created:
    {
        type: Date,
        default: Date.now
    },
    participants:
    [
        {
            time:{
                type:Date,
                default: Date.now
            },
            user:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }
    ],
    comments:
    [
        {
            user:
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            body: String,
            time:
            {
                type: Date,
                default: Date.now
            }
        }
    ]
});

schema.virtual('participant').get(function() {
    return this.participants.length;
});
 
schema.set('toJSON',
{
    transform: function(doc, ret, options)
    {
        ret.id = ret._id;
        ret.rating = doc.rating;
        delete ret.location;
        ret.location = {
            "latitude": doc.location[0],
            "longitude": doc.location[1]
        };
 
        delete ret._id;
        delete ret.__v;
        // delete ret.comments;
        // delete ret.participants;

    }
 
});
 
module.exports = mongoose.model('Plan', schema);