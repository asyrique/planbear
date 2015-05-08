// server.js

// BASE SETUP
// =============================================================================

try {
    require('dotenv').load();
    console.log("true");
} catch(ex) {
    console.log(ex);
}
// call the packages we need
var express    = require('express'),        // call express
    app        = express(),                 // define our app using express
    mongoose   = require('mongoose'),
    bodyParser = require('body-parser'),
    cors       = require('cors'),
    PlanBear = require('./routes/auth'),
    users = require('./routes/users'),
    plans = require('./routes/plan'),
    smsauth = require('./routes/twilio'),
    twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


// UTILITIES
// Load Mongo URI from .env for local development

// Load Models
var User = require('./models/user'),
    Plan = require('./models/plan'),
    SMSAuth = require('./models/sms-auth');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb'}));
app.use(bodyParser.json());
app.use(cors());

var port = process.env.PORT || 8080;        // set our port

// Setup Mongoose
mongoose.connect(process.env.MONGOLAB_URI, function(err) {
        if (err) {
            console.log("DB error!");
            throw err;
        }
});

var router = express.Router();

router.get('/', function(req, res) {
    res.json({ message: 'APIv2' });
});

// SMS Auth
router.post('/verify', smsauth.getcode);
router.get('/verify/:id/:code', smsauth.verify);

//Users
router.post('/users', users.create);
router.get('/users/:id', PlanBear.auth, users.fetch);
router.put('/users/:id', PlanBear.auth, users.update);
router.post('/users/:id/rating', PlanBear.auth, users.rating);
router.post('/users/:id/report', PlanBear.auth, users.report);
router.get('/users/id/photo', users.photo);

//Plans
router.post('/plans', PlanBear.auth, plans.create);
router.get('/plans', PlanBear.auth, plans.fetch);
router.get('/plans/:id', PlanBear.auth, plans.fetchOne);
router.post('/plans/:id/comments', PlanBear.auth, plans.comments);

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);