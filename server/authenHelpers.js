var url = require('url');
var mongoose = require('mongoose');
var User = require('../db/user.js').User;
var Business = require('../db/business.js').Business;

exports.logout = function(req,res){
  req.session.destroy();
  console.log('Logging out');
  res.redirect('/');
};

exports.authenticateUserToken = function (req, res, next) {
  // search if id === _id in user table
  User.promFindOne({_id: req.body.userId})
  .then( function (data) {
    // no record
    if (data === null) {
      console.log('no user by that id found');
      res.send(400);
    // record exists
    } else {
      // check if token matches for found user
      if (data.accessToken === req.body.accessToken) {
        console.log('user found, token matches user...proceed');
        next();
      } else {
        console.log('Token in DB: ', data.accessToken);
        console.log('user found, but token does not match that user');
        res.send(400);
      }
    }
  })
};

exports.registerToken = function (req, res){

  var apn;
  var id;
  var type;
  var query;
  var updateQuery;

  var path = url.parse(req.url);

  if (path.pathname === '/business/token') {
    id = mongoose.Types.ObjectId(req.body.businessId);
    type = Business;
  } else {
    id = mongoose.Types.ObjectId(req.body.userId);
    type = User;
  }
  query = {_id: id};

  if (req.body.type === 'apn'){
    apn = true;
    query['pushNotification.apn'] = {$in: [req.body.code]};

  } else if (req.body.type === 'gcm'){
    apn = false;
    query['pushNotification.gcm'] = {$in: [req.body.code]};

  } else {
    res.send(400, 'You must supply a type (apn/gcm)');
    return;
  }

  type.promFindOne(query)
  .then(function(data){
    if (data){
      res.send(200);
    } else {
      if (apn){
        updateQuery = {$push: {'pushNotification.apn': req.body.code}};
      } else {
        updateQuery = {$push: {'pushNotification.gcm': req.body.code}};
      }
      return type.promFindOneAndUpdate({_id: id}, updateQuery);
    }
  })
  .then(function(data){
    res.send(201);
  })
  .catch(function(error){
    res.send(404);
  })
}
