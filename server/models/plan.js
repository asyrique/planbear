var mongoose = require('mongoose');
 
var schema = new mongoose.Schema(
{
    creator:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: String,
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
 
schema.set('toJSON',
{
    transform: function(doc, ret, options)
    {
        ret.id = ret._id;
        ret.rating = doc.rating;
 
        delete ret._id;
        delete ret.__v;
    }
 
});
 
module.exports = mongoose.model('Plan', schema);