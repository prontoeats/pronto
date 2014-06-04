var url = require('url');
var qs = require('querystring');
var mongoose = require('mongoose');
var User = require('../db/user.js').User;
var Business = require('../db/business.js').Business;

var userOrBusiness = function (req) {

  var id;
  var type;
  var path = url.parse(req.url);
  var queryString;
  var accessToken;

  if (req.method === 'GET') {

    queryString = qs.parse(path.query);
    accessToken = queryString.accessToken;

    if (path.pathname.slice(0, 10) === '/business/') {
      id = mongoose.Types.ObjectId(queryString.businessId);
      type = Business;
    } else {
      id = mongoose.Types.ObjectId(queryString.userId);
      type = User;
    }

  } else if (req.method === 'POST') {

    accessToken = req.body.accessToken;

    if (path.pathname.slice(0, 10) === '/business/') {
      id = mongoose.Types.ObjectId(req.body.businessId);
      type = Business;

    } else {
      id = mongoose.Types.ObjectId(req.body.userId);
      type = User;
    }
  }

  return [id, type, accessToken];
};

exports.checkToken = function (req, res, next) {

  console.log('checkToken');
  var info = userOrBusiness(req);
  var id = info[0];
  var type = info[1];
  var accessToken = info[2];

  type.promFindOne({_id: id})
  .then( function (data) {
    if (data === null) {
      res.send(400);
    } else {
      if (data.accessToken === accessToken) {
        next();
      } else {
        res.send(400);
      }
    }
  })

};

exports.isValidated = function (req, res) {
  res.send(200);
};

exports.registerPushToken = function (req, res){

  console.log('registerPushToken');
  var info = userOrBusiness(req);
  var id = info[0];
  var type = info[1];

  var apn;
  var query = {_id: id};
  var updateQuery;

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
    res.send(404, 'bad registerPushToken');
  })
}
