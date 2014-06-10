var url = require('url');
var qs = require('querystring');
var User = require('../db/user.js').User;
var mapApi = require('./mapsApiHelpers.js');
var blue = require('bluebird');
var Business = require('../db/business.js').Business;
var misc = require('./miscHelpers.js');
var UserRequest = require('../db/userRequest.js').UserRequest;
var constants = require('./constants.js');
var login = require('./loginHelpers.js');
var mongoose = require('mongoose');
var push = require('./pushHelpers.js');

exports.sendAuthFail = function (res){
  res.send(404, 'failed authentication!');
};

exports.login = function(req, res){

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

      new User({
        email: email,
        firstName: firstName,
        lastName: lastName,
        accessToken: access_token
      })
      .save(function (err, data) {
        if (err) {
          exports.sendAuthFail(res);
        }
        res.send(201, {accessToken: data.accessToken, userId: data._id});
      })
    } else {

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

    request.promSave = blue.promisify(request.save);
    return request.promSave();
  })
  .then(function (data) {
    var msDiff =
      requestObj.targetDateTime.getTime() - new Date().getTime();

    // if request is still outstanding (i.e., active) at targetDateTime
    // convert status to "expired"
    setTimeout(function () {
      UserRequest.promFindOneAndUpdate(
        {requestId: data[0].requestId, requestStatus: 'Active'},
        {$set: {
          'requestStatus': 'Expired',
          'updatedAt': new Date()
        }},
        {new: true}
      )
    }, msDiff);
  })

  .then(function(){

    var pushBody = 'You have a new request!'
    var payload = {state: 'rest.requests'};

    if(apn.length){
      push.sendApnMessage(apn, pushBody, payload);
    }

    if(gcm.length){
      push.sendGcmMessage(gcm, pushBody, 'rest.requests');
    }

    res.send(201);
  })

  .catch(function(err){
    var error = 'Error with user request submission: '+err;
    res.send(400, error);
  })


};

exports.sendRequestInfo = function(req, res) {

  var queryString = qs.parse(url.parse(req.url).query);

  UserRequest.promFind(
    {
      userId: queryString.userId,
      targetDateTime: {$gt: new Date() - (1000 * 60 * 60)}
    },
    null,
    {limit:1,sort: {createdAt:-1}})
  .then(function(data){
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

    // reject all other outstanding offers when accepting an offer
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
  .then(function(){
    return UserRequest.promFindOne(
      {
        requestId: req.body.requestId,
        'results.businessId': businessId
      },
      {'results.pushNotification':1, 'results.businessId':1});
  })
  .then(function(data){

    var results = data.results;
    var pushNotification;

    for (var i = 0; i<results.length; i++){
      if(results[i].businessId+'' === businessId+''){
        pushNotification = results[i].pushNotification;
      }
    }

    if(pushNotification.apn.length){
      push.sendApnMessage(
        pushNotification.apn,
        'Your offer has been accepted!', {state: 'rest.acceptedOffers'}
      );
    }

    if(pushNotification.gcm.length){
      push.sendGcmMessage(
        pushNotification.gcm,
        'Your offer has been accepted!', 'rest.acceptedOffers'
      );
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
      'requestStatus': 'Canceled',
      'results.$.updatedAt': new Date()
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
    res.send(201, data.requestStatus);
  })
};
