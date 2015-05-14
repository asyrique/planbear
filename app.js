// newrelic

require('newrelic');

// setup dev

try {
	require('dotenv').load();
} catch (ex) {
	console.log(ex);
}

// dependencies

var express = require('express'),
	bodyParser = require('body-parser'),
	cors = require('cors'),
	mongoose = require('mongoose');

// init app

var app = express();

app.use(bodyParser.urlencoded({
	extended: true,
	limit: '2mb'
}));

app.use(bodyParser.json());

app.use(cors());

// connect to database

mongoose.connect(process.env.MONGOHQ_URL || 'mongodb://localhost/mesenja', function (err) {
	if (err) {
		console.log('DB error!');

		throw err;
	}
});

var PlanBear = require('./planbear/planbear');

var users = require('./routes/users'),
	plans = require('./routes/plan'),
	smsAuth = require('./routes/sms-auth');

// "home"

app.get('/', function (req, res) {
	res.send('PlanBear API v3');
});

// sms auth

app.post('/verify', smsAuth.getCode);
app.get('/verify/:id/:code', smsAuth.verify);

// users

app.post('/users', users.create);
app.get('/users/:id', PlanBear.auth, users.fetch);
app.put('/users/:id', PlanBear.auth, users.update);
app.post('/users/:id/rating', PlanBear.auth, users.rating);
app.post('/users/:id/report', PlanBear.auth, users.report);
app.get('/users/:id/photo', users.photo);

// plans

app.post('/plans', PlanBear.auth, plans.create);
app.get('/plans', PlanBear.auth, plans.fetch);
app.get('/plans/:id', PlanBear.auth, plans.fetchOne);
app.post('/plans/:id', PlanBear.auth, plans.join);
app.delete('/plans/:id/participants/:user', PlanBear.auth, plans.leave);
app.post('/plans/:id/comments', PlanBear.auth, plans.comments);

// start listening

app.listen(process.env.PORT || 8080, function() {
	console.log('Magic happens on ' + process.env.PORT || 8080);
});
