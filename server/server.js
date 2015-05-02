// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var mongoose   = require('mongoose');
var bodyParser = require('body-parser');
var cors       = require('cors');


// UTILITIES
// Load Mongo URI from .env for local development
try{
    console.log(require('dotenv').load());
}
catch(err){
    console.log(err);
}
var twilio     = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Load Models
var User = require('./models/user');
var Plan = require('./models/plan');
var SMSAuth = require('./models/sms-auth');

// Auth function

function planbearAuth(req, res, next){
    if (req.headers.token) {
        User.findOne({"token": req.headers.token}, function(err, user){
            if (err) {res.status(403).json({"message":"Fucked up token"});}
            req.user = user;

            next();
        });
    } else {
        res.status(401).json({"message":"Gimme token!"});
    }
}

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb'}));
app.use(bodyParser.json());
app.use(cors());

var port = process.env.PORT || 8080;        // set our port

// Setup Mongoose
mongoose.connect(process.env.MONGOHQ_URL, function(err) {
        if (err) {
            console.log("DB error!");
            throw err;
        }
});


// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'up' });
});

router.route('/verify')
    .post(function(req, res) {
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
    });
router.route('/verify/:id/:code')
    .get(function(req, res){
        SMSAuth.findOne({
            _id: req.params.id,
            code: req.params.code
        }, function(err, data) {
            if (err) return res.status(500).send(err);

            // delete document
            data.remove();

            User.findOne({
                phone: data.phone
            }, 'token', function(err, user) {
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
    });

router.route('/users')
    
    .post(function(req, res){

        var user = new User();

        //set data on users
        user.name = req.body.name;
        user.phone = req.body.phone;
        user.email = req.body.email;
        user.photo = req.body.photo;

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
    });

router.route('/users/:id')

    .get(planbearAuth, function(req, res){
        User.findOne({
            _id: req.params.id
        }, 'name email joined preferences', function(err, user) {
            if (err) return req.send(err);

            if (user._id.equals(req.user._id)) {
                res.send({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    preferences: user.preferences,
                    joined: user.joined,
                    rating: user.rating
                });
            } else {
                res.send(user.toJSON(true));
            }
        });
    })

    .put(planbearAuth, function(req, res){
        if (req.body.photo) req.user.photo = req.body.photo;
        if (req.body.preferences) req.user.preferences = req.body.preferences;

        req.user.save(function(err) {
            if (err) return res.send(err);

            res.send({});
        });
    });

router.route('/users/:id/rating')
    .post(planbearAuth, function(req, res){

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
    });

router.route('/users/:id/report')
    .post(planbearAuth, function(req, res){

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
    });

router.route('/plans')

    .post(planbearAuth, function(req, res){
        var plan = new Plan();

        //set data on Plan
        plan.creator = req.user._id;
        plan.type = req.body.type;
        plan.location = [req.body.location.longitude, req.body.location.latitude];
        plan.description = req.body.description;

        plan.save(function(err, plan){
            if (err){
                console.log(err);
                res.status(400).send({});
            }

            res.status(200).json({id: plan._id});
        });
    })

    .get(function(req, res){
        if (!req.query.longitude || !req.query.latitude) return res.status(400).json({"error":"No location info provided"});

        var coord = [req.query.longitude, req.query.latitude];

        Plan.find({
            location: {
                $near: coord,
                $maxDistance: 3
            }
        }).populate({
            path: 'creator',
            select: 'name'
        }).exec(function(err, data) {
            if (err) return res.send(err);

            data.map(function(plan) {
                plan.participants = plan.participants.length;
                plan.comments = plan.comments.length;

                return plan;
            });

            res.send(data);
        });
    });

router.route('/plans/:id')
    .get(planbearAuth, function(req, res){
        Plan.findOne({"_id": req.params.id}, "", function(err, plan){

            // Cases 1: Plan maker accesses plan
            if (plan.creator._id === req.params.id){
                res.status(200).json(plan);
            }
            //You are not a participant.
            else if (plan.participants.indexOf({"id": req.params.id}) === -1){
                res.status(200).json({
                    creator : plan.creator,
                    type : plan.type,
                    location : plan.location,
                    description : plan.description,
                    created : plan.created,
                    participant: plan.participant
                });
            }
            // You are a signed up user.
            else {
                res.status(200).json(plan);
            }
        });
    })

    .put(function(req, res){

    })

    .post(function(req, res){

    });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);