// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var mongoose   = require('mongoose');
var bodyParser = require('body-parser');
var crypto     = require('crypto');

// Load Mongo URI from .env for local development
console.log(require('dotenv').load());

//Initialize hashing function
var hasher = crypto.createHash('sha256');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// Setup Mongoose
mongoose.connect(process.env.MONGOHQ_URL, function(err) {
        if (err) {
            console.log("DB error!");
            throw err;
        }
});

// Load Models
var User = require('./models/user');
var Plan = require('./models/plan');


// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.use(function(req, res, next) {
    console.log("Request");
    next();
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'Driving the PlanBear API!' });
});

router.route('/user')
    
    .post(function(req, res){

        var user = new User();

        //set data on users
        user.name = req.body.name;
        user.phoneNum = req.body.phoneNum;
        console.log(req.body.name);
        user.location = [req.body.longitude, req.body.latitude];
        user.token = hasher.update(user.name + toString(Date.now) + 'pedobear').digest('hex');

        //Saving the user and sending token for 
        user.save(function(err){
            if (err){
                console.log(err);
                throw err;
            }

            res.json({ "token": user.token,"user": user});
        });
    });

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);