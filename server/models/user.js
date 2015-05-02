var mongoose = require('mongoose');
 
var schema = new mongoose.Schema(
{
    name: String,
    email:
    {
        type: String,
        unique: true
    },
    phone:
    {
        type: String,
        unique: true,
        select: false
    },
    photo: String,
    joined:
    {
        type: Date,
        default: Date.now
    },
    token:
    {
        type: String,
        unique: true
    },
    preferences: [String],
    ratings:
    [
        {
            user:
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            rating: Number,
            time:
            {
                type: Date,
                default: Date.now
            }
        }
    ],
    reports:
    [
        {
            user:
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            type: String,
            description: String,
            time:
            {
                type: Date,
                default: Date.now
            }
        }
    ]
});

schema.virtual('rating').get(function()
{
    return this.ratings.reduce(function(cumulativeRating, currRating, i){
        return cumulativeRating + currRating.rating;
    }, cumulativeRating = 0);
    // var rating = 0;
 
    // for (i = 0; i < this.ratings.length; i++)
    // {
    //     rating += this.ratings[i].rating;
    // }
 
    // return rating;
});

schema.set('toJSON',
{
    transform: function(doc, ret, options)
    {
        ret.id = ret._id;
 
        delete ret._id;
        delete ret.__v;
 
        delete ret.flag;
        delete ret.phone;
        delete ret.email;
        delete ret.token;
        delete ret.ratings;
        delete ret.reports;
    }
 
});
 
module.exports = mongoose.model('User', schema);