var twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
var SMSAuth = require('../models/sms-auth');
var User = require('../models/user');

exports.getcode = function(req, res) {
        if (req.body.phone) {
            var random = Math.floor(Math.random()*(9999-1000+1)+1000);

            var smsAuth = new SMSAuth();

            smsAuth.phone = req.body.phone;
            smsAuth.code = random;

            smsAuth.save(function(err, data) {
                if (err) return res.status(500).send(err);

                twilio.messages.create({
                    body: 'Use ' + random + ' as your verification code.',
                    to: req.body.phone,
                    from: process.env.TWILIO_NUMBER
                }, function(err, message) {
                    if (err) {
                        console.error('twilio', err);

                        return res.send(err);
                    }

                    console.log('twilio', message);

                    res.send({
                        id: data._id
                    });
                });
            });
        }
    };

exports.verify = function(req, res){
        SMSAuth.findOne({
            _id: req.params.id,
            code: req.params.code
        }, function(err, data) {
            if (err || data === null) return res.status(500).send(err);

            // delete document
            data.remove();

            User.findOne({
                phone: data.phone
            }, 'token name preferences joined', function(err, user) {
                if (err) return res.send(404).send(err);

                if (user) {
                    data.remove();

                    res.send({
                        token: user.token,
                        user: {
                            id: user._id,
                            name: user.name,
                            preferences: user.preferences,
                            joined: user.joined
                        }
                    });
                } else {
                    res.send({
                        phone: data.phone
                    });

                    data.remove();
                }
            });
        });
    };