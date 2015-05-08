var User = require('../models/user');

exports.auth = function(req, res, next){
    if (req.headers.token) {
        User.findOne({"token": req.headers.token}, function(err, user){
            if (err) return res.status(403).json({"message":"Fucked up token"});

            req.user = user;

            next();
        });
    } else {
        res.status(401).json({"message":"Gimme token!"});
    }
};