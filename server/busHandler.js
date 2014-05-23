var Business = require('../db/business.js').Business;
var Requests = require('../db/userRequest.js').UserRequest;
var mapApi = require('./mapsApiHelpers.js');
var prom = require('./promisified.js');
var authen = require('./authenHelpers.js');

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

  //Find the account that matches the email
  Business.promFindOne({email: req.body.email})
    .then(function (data) {

      // while we have the data, store businessId so we can store in session
      req.body.businessId = data.businessId;

      //return a promise to continue the chain - promise will be resolved
      //once bcrypt completes the comparison
      return prom.bcryptCompare(req.body.password, data.password)
    })

    //check the results of the comparison
    .then(function (result) {

      //if the passwords match - direct to the business dashboard
      if (result) {
        authen.busCreateSession(req);
        res.redirect(302, '/business/dashboard');

      //if the passwords don't match redirect
      } else {
        console.log('business password do not match');
        exports.businessSendAuthFail(res);
      }
    })

    //if the account does not already exist redirect
    .catch(function (e) {
      console.log('business didnt find username');
      exports.businessSendAuthFail(res);
    })
};

exports.signup = function (req, res) {

  //check to see if business username exists in database
  Business.promFindOne({email: req.body.email})
    .then(function (data){

      //if the business username exists, redirect
      if (data) {
        console.log('business username already exists')
        exports.businessSendAuthFail(res);

      //otherwise, save the business account into the database and redirect to business dashboard
      } else {
        new Business(req.body).save(function (err) {
          if (err) {
            console.log('issue saving new business account');
            exports.businessSendAuthFail(res);
          } else {
            res.sendfile('./views/busDashboard.html');
          }
        })
      }
    })

    //if there was an issue searching for the user, redirect
    .catch(function (e) {
      console.log('business signup failed ', e);
      exports.businessSendAuthFail(res);
    })
};

exports.showRequests = function (req, res) {
  // TODO: remove default; require authentication (on app-config.js)
  var businessId = req.session.businessId || 1;

  // search through requests collection
  // TODO: filter so not all requests are retrieved...
  Requests.find(function (err, data) {

    console.log('requests:');
    console.dir(data);
    var results = [];
    for (var i = 0; i < data.length; i += 1) {
      // look for results property on each document
      for (var j = 0; j < data[i].results.length; j += 1) {
        // check if document results array has an object with the business id
        if (data[i].results[j].businessId === businessId) {
          // TODO: or copy entire data[i] object and remove results?
          var requestObj = {};
          requestObj.address = data[i].address;
          requestObj.city = data[i].city;
          requestObj.groupSize = data[i].groupSize;
          requestObj.requestNotes = data[i].requestNotes;
          requestObj.requestId = data[i].requestId;
          requestObj.userId = data[i].userId;
          requestObj.targetDateTime = data[i].targetDateTime;
          results.push(requestObj);
        }
      }
    }
    res.send(results);

  });
}

exports.showOffers = function (req, res) {

}

exports.sendOffer = function (req, res) {
  console.log('inside sendOffer');
  console.dir(req.body);
}
