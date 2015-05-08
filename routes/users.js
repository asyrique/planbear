var User = require('../models/user');
var trianglify = require('trianglify');

exports.create = function(req, res){

        var user = new User();

        //set data on users
        user.name = req.body.name;
        user.phone = req.body.phone;
        user.email = req.body.email;
        user.photo = req.body.photo;
        user.preferences = req.body.preferences;

        user.token = require('crypto').createHash('sha256').update(user.name + toString(Date.now()) + user.phone + 'pedobear').digest('hex');

        //Saving the user and sending token for 
        user.save(function(err){
            if (err) return res.status(400).json({"error":"Email already exists"});

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

exports.fetch = function(req, res){
        
        User.findOne({
            _id: req.params.id
        }, 'name email joined preferences ratings', function(err, user) {
            if (err) return req.send(err);

            if (req.user._id.equals(req.params.id)) {
                res.send({
                    id: user._id,
                    name: user.name,
                    preferences: user.preferences,
                    joined: user.joined
                });
            } else {
                res.send(user);
            }
        });
    };

exports.update = function(req, res){
        
        if (req.body.photo) req.user.photo = req.body.photo;
        if (req.body.preferences) req.user.preferences = req.body.preferences;

        req.user.save(function(err) {
            if (err) return res.send(err);

            res.send({});
        });
    };

exports.rating = function(req, res){

        User.findByIdAndUpdate( req.params.id,
            {$push: {ratings: {
                user: req.user._id,
                rating: req.body.rating
            }}},
            function(err, model){
                if (err){
                    res.status(400).json({"fuck":"you"});
                }
                else
                    res.status(200).json({});
            });
    };

exports.report = function(req, res){

        User.findByIdAndUpdate( req.params.id,
            {$push: {reports: {
                user: req.user._id,
                description: req.body.reason
            }}},
            function(err, model){
                if (err){
                    res.status(400).json({"fuck":"you too"});
                }
                else
                    res.status(200).json({});

            });
    };

exports.photo = function(req, res){
        User.findOne({
            _id: req.params.id,
        }, function(err, user){
                if (err) return res.status(400).json({});
                var buf;
                var contenttype;
                if (!user.photo) {
                    buf = new Buffer(trianglify({height: 300, width: 300, seed: req.params.id}));
                    contenttype = "png";
                } else {
                    buf = new Buffer(user.photo, 'base64');
                    contenttype = "jpeg";
                }

                res.writeHead(200, {
                    'Content-Type': 'image/' + contenttype,
                    'Content-Length': buf.length
                });
                res.end(buf);
        });
    };