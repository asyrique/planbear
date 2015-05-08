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
    Planbear = require('./routes/auth'),
    users = require('./routes/users'),
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
mongoose.connect(process.env.MONGOHQ_URL, function(err) {
        if (err) {
            console.log("DB error!");
            throw err;
        }
});

var router = express.Router();

router.get('/', function(req, res) {
    res.json({ message: 'up' });
});

// SMS Auth
router.post('/verify', smsauth.getcode);
router.get('/verify/:id/:code', smsauth.verify);

//Users
router.post('/users', users.create);
router.get('/users/:id', Planbear.auth, users.fetch);
router.put('/users/:id', Planbear.auth, users.update);
router.post('/users/:id/rating', Planbear.auth, users.rating);
router.post('/users/:id/report', Planbear.auth, users.report);
router.get('/users/id/photo', users.photo);

router.route('/plans')

    .post(Planbear.auth, function(req, res){
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

    .get(Planbear.auth, function(req, res){
        if (!req.query.longitude || !req.query.latitude) {
            return res.status(400).send({
                error: 'No location provided'
            });
        }

        var distance = req.query.distance || 20,
            coordinates = [req.query.longitude, req.query.latitude];

        distance /= 6371;

        Plan.find({
            location: {
                $near: coordinates,
                $maxDistance: distance
            }
        }).populate({
            path: 'creator',
            select: 'name'
        }).exec(function(err, data) {
            if (err) return res.send(err);

            res.send(data);
        });
    });

router.route('/plans/:id')
    .get(Planbear.auth, function(req, res) {
        Plan.findOne({
            _id: req.params.id
        }).populate([{
            path: 'creator',
            select: 'name'
        }, {
            path: 'comments.user',
            select: 'name'
        }]).exec(function(err, plan) {
            if (err) return res.send(err);

            var isParticipant = plan.participants.some(function(participant) {
                if (participant.user.equals(req.user._id)) return true;
            });

            if (plan.creator._id.equals(req.user._id) || isParticipant) {
                return res.send({
                    id: plan._id,
                    description: plan.description,
                    creator: plan.creator,
                    created: plan.created,
                    type: plan.type,
                    participants: plan.participants.length,
                    comments: plan.comments
                });
            } else {
                return res.send(plan);
            }
        });
    });

router.route('/plans/:id/comments')
    .post(Planbear.auth, function(req, res) {
        Plan.findOne({
            _id: req.params.id
        }, function(err, plan) {
            if (err) return res.send(err);

            var isParticipant = plan.participants.some(function(participant) {
                if (participant.user.equals(req.user._id)) return true;
            });

            if (plan.creator.equals(req.user._id) || isParticipant) {
                var comment = plan.comments.create({
                    user: req.user._id,
                    body: req.body.body
                });

                plan.comments.push(comment);

                plan.save(function(err) {
                    if (err) return res.send(err);

                    res.send({
                        id: comment._id,
                        user: {
                            id: req.user._id,
                            name: req.user.name
                        },
                        body: comment.body,
                        time: comment.time
                    });
                });
            } else {
                return res.status(403).send({});
            }
        });
    });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);