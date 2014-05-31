var url = require('url');
var qs = require('querystring');
var User = require('../db/user.js').User;
var prom = require('./promisified.js');
var authen = require('./authenHelpers.js');
var mapApi = require('./mapsApiHelpers.js');
var blue = require('bluebird');
var Business = require('../db/business.js').Business;
var misc = require('./miscHelpers.js');
var twilio = require('./twilioApiHelpers.js');
var UserRequest = require('../db/userRequest.js').UserRequest;
var Counter = require('../db/counter.js').Counter;
var constants = require('./constants.js');
var login = require('./loginHelpers.js');
var mongoose = require('mongoose');
var push = require('./pushHelpers.js');

exports.sendIndex = function (req, res){
  res.sendfile('./views/index.html');
};

exports.sendAbout = function(req, res){
  res.sendfile('./public/html/about.html');
}

exports.sendAuthFail = function (res){
  res.send(404, 'failed authentication!');
};

exports.dashboard = function(req, res){
  res.sendfile('./public/html/userDash.html');
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
    console.log('getUserInfo then');
    data = JSON.parse(data[1]);
    console.dir(data);
    email = data.emails[0]['value'];
    firstName = data.name.givenName;
    lastName = data.name.familyName;
    return User.promFindOne({email: email});
  })
  .then( function (data) {
    console.log('****');
    console.dir(data);
    if (data === null) {
      // create new user account in database
      console.log('access_token:', access_token);
      new User({
        email: email,
        firstName: firstName,
        lastName: lastName,
        accessToken: access_token
      })
      .save(function (err, data) {
        if (err) {
          console.log(err);
          exports.sendAuthFail(res);
        }
        console.log('save data: ',data);
        res.send(201, {accessToken: data.accessToken, userId: data._id});
      })
    } else {
      console.log('data in else statement');
      console.dir(data);
      console.log(access_token);
      // update token information (access & refresh) in database
      User.promFindOneAndUpdate(
        {email: email},
        {$set: {accessToken: access_token}},
        {new: true}
      ).then( function (data) {
        res.send(201, {accessToken: data.accessToken, userId: data._id});
      });
    }
  })
  .catch( function (data) {
    console.log(data);
  });
};

exports.request = function(req, res) {

  console.log('received data: ',req.body);
  var apn;  //apple tokens to push to
  var gcm;  //google registration ids to push to
  var requestObj = req.body; // make sure Joe sends id back as "userId"

  //convert minutes to time
  var dateTime = new Date();
  dateTime.setMinutes(dateTime.getMinutes() + Number(requestObj.mins));
  requestObj.targetDateTime = dateTime;

  mapApi.convertUserRequestLocation(requestObj)

  // create new request
  .then(function () {
    request = new UserRequest(requestObj);

    //promisifying the save function
    request.promSave = blue.promisify(request.save);
    return request.promSave();
  })

  //create new promise to continue chain
  .then(function(){
    return new blue (function (resolve, reject) {
      resolve([requestObj.location, requestObj.radius]);
    })
  })

  //find businesses nearby the request location
  .then(Business.promFindNearby)

  //parse and format the data
  .then(misc.parseNearbyData)

  //store the data as a parameter on the request Obj and save
  .then(function(data){
    console.log('storing results property');

    apn = data[1];
    gcm = data[2];

    request.results = data[0];
    // numbers = data[1];
    return request.promSave();
  })
  .then(function (data) {
    // data should be an array of success values [request, numberAffected]
    console.log('data:', data);
    // convert a request still in 'active' state to 'expired' after 10 mins
    setTimeout(function () {
      UserRequest.promFindOneAndUpdate(
        {requestId: data[0].requestId, requestStatus: 'Active'},
        {$set: {
          'requestStatus': 'Expired',
          'updatedAt': new Date()
        }},
        {new: true}
      )
    }, 1000 * 60 * 10);
  })
  .then(function(){
    //send out push notifications
    console.log('apn to push to: ', apn);
    var pushBody = 'You have a new request.'
    var payload = {view: 'rest.requests'};
    push.sendApnMessage(apn, pushBody, payload);
    console.log('requestObj: ', requestObj)
    res.send(201);

    console.log('COMPLETED USER POST REQUEST');
  })
};

exports.sendRequestInfo = function(req, res) {

  console.log('got to send requestInfo');
  var queryString = qs.parse(url.parse(req.url).query);

  console.log('querystring: ',queryString);
  UserRequest.promFind(
    {userId: queryString.userId},
    null,
    {limit:1,sort: {createdAt:-1}})
  .then(function(data){
    // console.log('DATA: ', data);

    console.log('MONGO REQUEST DATA: ', data);
    res.send(200, data[0]);
  })
};

exports.acceptOffer = function(req, res) {

  var businessId = mongoose.Types.ObjectId(req.body.businessId);

  UserRequest.promFindOneAndUpdate(
    {requestId: req.body.requestId, 'results.businessId': businessId},
    {$set: {
      'requestStatus': 'Accepted',
      'results.$.status': 'Accepted',
      'updatedAt': new Date(),
      'results.$.updatedAt': new Date()
    }},
    {new: true}
  )
  .then(function (data) {
    console.log('Updated offer status to accepted: ', data);
    res.send(201);
  })
  // set outstanding offers for this request (status: offered) to rejected
  .then(function () {
    UserRequest.promUpdate(
    {
      'requestId': req.body.requestId,
      'results.status': 'Offered'
    },
    {$set: {
      'results.status': 'Rejected',
      'results.updatedAt': new Date()
    }},
    {new: true}
  )})
};

exports.rejectOffer = function(req, res) {

  var businessId = mongoose.Types.ObjectId(req.body.businessId);

  UserRequest.promFindOneAndUpdate(
    {requestId: req.body.requestId, 'results.businessId': businessId},
    {$set: {
      'results.$.status': 'Rejected',
      'results.$.updatedAt': new Date()
    }},
    {new: true}
  )
  .then(function (data) {
    console.log('Updated offer status to rejected: ', data);
    res.send(201);
  })
};

exports.cancelRequest = function(req, res) {

  UserRequest.promFindOneAndUpdate(
    {requestId: req.body.requestId},
    {$set: {
      'requestStatus': 'Canceled'
    }},
    {new: true}
  )
  .then(function (data) {
    console.log('Updated request to be rejected: ', data);
    res.send(201);
  })
};

exports.checkLastRequestStatus = function(req, res) {
  UserRequest.promFindOne(
    {userId: data._id},
    null,
    {sort: {createdAt: -1}}
  )
  .then(function (data) {
    console.log('Last request for this user: ', data);
    console.log('requestStatus of last request:', data.requestStatus);
    res.send(201);
  })
};

exports.registerToken = function (req, res){

  var userId = mongoose.Types.ObjectId(req.body.userId);

  var query = {_id: userId};

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

  User.promFindOne(query)
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
      return User.promFindOneAndUpdate({_id: userId}, updateQuery);
    }
  })
  .then(function(data){
    res.send(201);
  })
}