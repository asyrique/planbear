var Plan = require('../models/plan');

exports.create = function(req, res){
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
    };

exports.fetch = function(req, res){
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
    };

exports.fetchOne = function(req, res) {
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
    };

exports.comments = function(req, res) {
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
    };