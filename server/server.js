// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var mongoose   = require('mongoose');
var bodyParser = require('body-parser');
var crypto     = require('crypto');
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

//Initialize hashing function
var hasher = crypto.createHash('sha256');

// Load Models
var User = require('./models/user');
var Plan = require('./models/plan');
var SMSAuth = require('./models/sms-auth');

// Auth function

function planbearAuth(req, res, next){
    if (req.headers.token) {
        User.findOne({"token": req.headers.token}, function(err, user){
            if (err) {res.status(403).json({"message":"Fucked up token"});}

            console.log(user);
            req.user = user;

            next();
        });
    } else {
        res.status(401).json({"message":"Gimme token!"});
    }
}

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
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
                    from: 'PlanBear'
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
            // data.remove();

            res.send({});
        });
    });

router.route('/users')
    
    .post(function(req, res){

        var user = new User();

        //set data on users
        user.name = req.body.name;
        user.phone = req.body.phone;
        user.email = req.body.email;
        user.photo = new Buffer(req.body.photo, 'base64');
        user.token = hasher.update(user.name + toString(Date.now()) + user.phone + 'pedobear').digest('hex');

        //Saving the user and sending token for 
        user.save(function(err){
            if (err){
                res.status(401).json({"error":"Email already exists"});
            }

            res.json({ "token": user.token,"user": user});
        });
    });

router.route('/users/:id')

    .get(planbearAuth, function(req, res){
        User.findOne({"_id": req.params.id}, function(err, user){
            res.json(user);
        });
    })

    .put(planbearAuth, function(req, res){

        req.user.name = req.body.name;
        req.user.photo = new Buffer(req.body.photo, 'base64');
        req.user.preferences = req.body.preferences;

    });

router.route('/plans')

    .post(planbearAuth, function(req, res){
        var plan = new Plan();

        //set data on Plan
        plan.creator = req.user;
        plan.category = req.body.category;
        plan.location = [req.body.location.longitude, req.body.location.latitude];
        plan.description = req.body.description;

        plan.save(function(err){
            if (err){
                console.log(err);
                throw(err);
            }

            res.status(200).json({});
        });
    })

    .get(function(req, res){

    });

router.route('/plan/:id')
    .get(function(req, res){

    })

    .put(function(req, res){

    });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);