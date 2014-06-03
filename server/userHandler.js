var url = require('url');
var qs = require('querystring');
var User = require('../db/user.js').User;
var prom = require('./promisified.js');
var authen = require('./authenHelpers.js');
var mapApi = require('./mapsApiHelpers.js');
var blue = require('bluebird');
var Business = require('../db/business.js').Business;
var misc = require('./miscHelpers.js');
var UserRequest = require('../db/userRequest.js').UserRequest;
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
    data = JSON.parse(data[1]);
    email = data.emails[0]['value'];
    firstName = data.name.givenName;
    lastName = data.name.familyName;
    return User.promFindOne({email: email});
  })
  .then( function (data) {
    if (data === null) {
      // create new user account in database
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
        res.send(201, {accessToken: data.accessToken, userId: data._id});
      })
    } else {
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

  //APN tokens and GCM registration IDs to send push notifications to
  //later in this function
  var apn;
  var gcm;

  //Object that will be used to create a new User Request
  var requestObj = req.body;

  //Convert requested minutes to time and save to requestObj
  var dateTime = new Date();
  dateTime.setMinutes(dateTime.getMinutes() + Number(requestObj.mins));
  requestObj.targetDateTime = dateTime;

  //Convert location information to latitude/longitude if needed
  mapApi.convertUserRequestLocation(requestObj)

  //Look for userId in database to store push notification tokens/reg IDs
  .then(function(){
    var userId = mongoose.Types.ObjectId(requestObj.userId);
    return User.promFindOne({_id: userId});
  })
  .then(function(data){
    requestObj.pushNotification = data.pushNotification;

    //create new promise to continue chain
    return new blue (function (resolve, reject) {
      resolve([requestObj.location, requestObj.radius]);
    })
  })

  //find businesses nearby the requested location
  .then(Business.promFindNearby)

  //parse and format the data
  .then(misc.parseNearbyData)

  //store the query results data as a parameter on the request Obj and save
  //store the apn/gcm numbers for pushing notifications later in the function
  .then(function(data){

    requestObj.results = data[0];
    apn = data[1];
    gcm = data[2];

    request = new UserRequest(requestObj);

    //promisifying the save function to enable chaining
    request.promSave = blue.promisify(request.save);
    return request.promSave();
  })

  .then(function(){
    //format messages and information to send out via push notifications
    var pushBody = 'You have a new request!'
    var payload = {view: 'rest.requests'};

    //if there are apn tokens to push to, push the message to them
    if(apn.length){
      push.sendApnMessage(apn, pushBody, payload);
    }

    //if there are gcm registration IDs to push to, push the message to them
    if(gcm.length){
      push.sendGcmMessage(gcm, pushBody);
    }

    //send successful response back to user
    res.send(201);
    console.log('COMPLETED USER POST REQUEST');
  })

  .catch(function(err){
    var error = 'Error with user request submission: '+err;
    res.send(400, error);
    console.log(error);
  })

};

exports.sendRequestInfo = function(req, res) {

  var queryString = qs.parse(url.parse(req.url).query);

  UserRequest.promFind(
    {userId: queryString.userId},
    null,
    {limit:1,sort: {createdAt:-1}})
  .then(function(data){
    // console.log('DATA: ', data);

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
    res.send(201);

    UserRequest.promFindOne({requestId: req.body.requestId})

    .then(function(data){

      var tempResults = data.results;
       for (var i = 0; i < tempResults.length; i += 1) {
         if (tempResults[i].status === 'Offered') {
           tempResults[i].status = 'Rejected';
           tempResults[i].updatedAt = new Date();
         }
       }
       return UserRequest.promFindOneAndUpdate(
         {requestId: req.body.requestId},
         {$set: {
           'results': tempResults
         }},
         {new: true}
       );
    });
  })
  // set outstanding offers for this request (status: offered) to rejected
  .then(function(){
    return UserRequest.promFindOne({requestId: req.body.requestId, 'results.businessId': businessId},
      {'results.pushNotification':1});
  })
  .then(function(data){
    if(data.results[0].pushNotification.apn.length){
      push.sendApnMessage(data.results[0].pushNotification.apn, 'Your offer has been acceped!', {view: 'rest.accepted'});
    }

    if(data.results[0].pushNotification.gcm.length){
      push.sendGcmMessage(data.results[0].pushNotification.gcm, 'Your offer has been acceped!');
    }

  })
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
    res.send(201);
  })
};
