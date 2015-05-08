var mongoose = require('mongoose');

var schema = new mongoose.Schema(
{
    phone: String,
    code: Number
});

schema.set('toJSON',
{
    transform: function(doc, ret, options)
    {
        ret.id = ret._id;
 
        delete ret._id;
        delete ret.__v;
        delete ret.code;
    }
 
});

module.exports = mongoose.model('SMSAuth', schema);