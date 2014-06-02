
var url = require('url');
var qs = require('querystring');
var Business = require('../db/business.js').Business;
var UserRequest = require('../db/userRequest.js').UserRequest;
var Offer = require('../db/offers.js').Offer;
var mapApi = require('./mapsApiHelpers.js');
var prom = require('./promisified.js');
var authen = require('./authenHelpers.js');
var login = require('./loginHelpers.js');
var mongoose = require('mongoose');
var misc = require('./miscHelpers.js');
var push = require('./pushHelpers.js')


exports.sendBusIndex = function(req, res){
  res.sendfile('./views/busIndex.html');
};

exports.businessSendAuthFail = function (res){
  res.send(404, 'failed authentication!');
}

exports.dashboard = function(req, res){
  res.sendfile('./views/busDashboard.html');
};

exports.login = function(req, res){

  // receive POST request with 'code'
  var code = req.body.code;
  var access_token;
  var email;
  var firstName;
  var lastName;

  login.getGoogleToken(code)
  .then( function (data) {
    access_token = data;
    return login.getUserInfo(access_token);
  })
  .then( function (data) {
    data = JSON.parse(data[1]);
    email = data.emails[0]['value'];
    firstName = data.name.givenName;
    lastName = data.name.familyName;
    return Business.promFindOne({email: email});
  })
  .then( function (data) {
    if (data === null) {
      res.send(201, {accessToken: access_token, signup: true});
    } else {
      // update token information (access & refresh) in database
      Business.promFindOneAndUpdate(
        {email: email},
        {$set: {accessToken: access_token}},
        {new: true}
      ).then( function (data) {
        res.send(201, {accessToken: data.accessToken, businessId: data._id, signup: false});
      });
    }
  })
  .catch( function (data) {
    console.log(data);
  });
};

exports.signup = function (req, res) {

  // receive token and use to call Google to retrieve email/first/last
  var businessInfo = req.body;
  var accessToken = businessInfo.accessToken;

  login.getUserInfo(accessToken)
  .then( function (data) {
    data = JSON.parse(data[1]);
    businessInfo.email = data.emails[0]['value'];
    businessInfo.firstName = data.name.givenName;
    businessInfo.lastName = data.name.familyName;
    new Business(businessInfo).save(function (err, data) {
      if (err) {
        console.log('problem saving new business');
        res.send(400, "OMG could not save");
        throw err;
      }
      // with other information received, save to database
      res.send(201, {accessToken: accessToken, businessId: data._id});
    })
  })
  .catch( function (e) {
    res.send(400, "OMG could not find that token in google");
    throw e;
  });
};

exports.showRequests = function (req, res) {
  // TODO: remove default; require authentication (on app-config.js)

  var queryString = qs.parse(url.parse(req.url).query);

  var oid = mongoose.Types.ObjectId(queryString.businessId);

  UserRequest.promFind({'results.businessId': oid})
  .then(function(data){
    var results = misc.parseBusinessOpenRequests(data, oid, 'Pending');
    res.send(200, results);
  })

}

exports.declineRequests = function(req,res){

  var data = req.body;

  var businessId = mongoose.Types.ObjectId(data.businessId);


  UserRequest.promFindOneAndUpdate(
    {requestId: data.requestId, 'results.businessId': businessId},
    {$set: {
      'results.$.status': 'Declined',
      'results.$.updatedAt': new Date()
    }},
    {new: true}
  )
  .then(function(data){
    res.send(201);
  })
};

exports.acceptRequests = function(req,res){

  var data = req.body;

  var businessId = mongoose.Types.ObjectId(data.businessId);


  // TODO: earlier of ten minutes from now and request targetDateTime
  // (need to look up requests targetDateTime)
  var dateTime = new Date();
  dateTime.setMinutes(dateTime.getMinutes() + 10);

  UserRequest.promFindOneAndUpdate(
    {requestId: data.requestId, 'results.businessId': businessId},
    {$set: {
      'results.$.status': 'Offered',
      'results.$.updatedAt': new Date(),
      'results.$.replies': data.offer,
      'results.$.expirationDateTime': dateTime
    }},
    {new: true}
  )
  .then(function(data){

    console.log('data in accept requests: ', data.pushNotification);
    console.log('type: ', typeof data.pushNotification);


    if (data.pushNotification.apn.length){
      push.sendApnMessage(data.pushNotification.apn, 'You have a new offer!', {view: 'user.active'});
    }

    if (data.pushNotification.gcm.length){
      push.sendGcmMessage(data.pushNotification.gcm, 'You have a new offer!');

    }

    res.send(201);
  })
  .then(function () {
    // if offer is still outstanding (status: offered) after ten minutes
    // convert status to "expired"
    setTimeout(function () {
      UserRequest.promFindOneAndUpdate(
        {requestId: data.requestId, 'results.businessId': businessId, 'results.status': 'Active'},
        {$set: {
          'results.$.status': 'Expired',
          'results.$.updatedAt': new Date()
        }},
        {new: true}
      )
    }, 1000 * 60 * 10);
  });
};

exports.showOffered = function (req, res) {

  var queryString = qs.parse(url.parse(req.url).query);

  var oid = mongoose.Types.ObjectId(queryString.businessId);

  UserRequest.promFind({'results.businessId': oid})
  .then(function(data){
    var results = misc.parseBusinessOpenRequests(data, oid, 'Offered');
    res.send(200, results);
  })
}

exports.showAccepted = function (req, res) {

  var queryString = qs.parse(url.parse(req.url).query);

  var oid = mongoose.Types.ObjectId(queryString.businessId);

  UserRequest.promFind({'results.businessId': oid})
  .then(function(data){
    var results = misc.parseBusinessOpenRequests(data, oid, 'Accepted');
    res.send(200, results);
  })
}

exports.registerToken = function (req, res){

  var businessId = mongoose.Types.ObjectId(req.body.businessId);

  var query = {_id: businessId};

  //if true, then the code is a apn token. 
  //if false, then the code is a gcm registration id
  var apn; 

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


  Business.promFindOne(query)
  .then(function(data){


    if (data){
      res.send(200);
    } else {
      var updateQuery
      if (apn){
        updateQuery = {$push: {'pushNotification.apn': req.body.code}};
      } else {
        updateQuery = {$push: {'pushNotification.gcm': req.body.code}};
      }
      return Business.promFindOneAndUpdate({_id: businessId}, updateQuery);
    }
  })
  .then(function(data){
    res.send(201);
  })
  .catch(function(error){
    res.send(404);
  })
}





