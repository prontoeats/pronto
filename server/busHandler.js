
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
  var code = req.body.code || '4/LLfI8uvWrbPXG2Y-YMDgkwqI51hS.wl7iENCqCTMfEnp6UAPFm0Fq-bN1jAI';
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
    return Business.promFindOne({email: email});
  })
  .then( function (data) {
    console.log('****');
    console.dir(data);
    if (data === null) {
      res.send(201, {accessToken: access_token, signup: true});
    } else {
      console.log('data in else statement');
      console.dir(data);
      console.log(access_token);
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
  console.log('BODY: ',req.body);

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
      console.log('new business saved to database');
      res.send(201, {accessToken: accessToken, businessId: data._id});
    })
  })
  .catch( function (e) {
    console.log('error looking up user information with google');
    res.send(400, "OMG could not find that token in google");
    throw e;
  });

  //check to see if business username exists in database
  // Business.promFindOne({email: req.body.email})
  //   .then(function (data){

  //     //if the business username exists, redirect
  //     if (data) {
  //       console.log('business username already exists')
  //       exports.businessSendAuthFail(res);

  //     //otherwise, save the business account into the database and redirect to business dashboard
  //     } else {
  //       new Business(req.body).save(function (err) {
  //         if (err) {
  //           console.log('issue saving new business account');
  //           exports.businessSendAuthFail(res);
  //         } else {
  //           res.sendfile('./views/busDashboard.html');
  //         }
  //       })
  //     }
  //   })

  //   //if there was an issue searching for the user, redirect
  //   .catch(function (e) {
  //     console.log('business signup failed ', e);
  //     exports.businessSendAuthFail(res);
  //   })
};

exports.showRequests = function (req, res) {
  // TODO: remove default; require authentication (on app-config.js)

  console.log('got to showRequests');
  console.log('req.url:', req.url);
  var queryString = qs.parse(url.parse(req.url).query);
  console.log('queryString:', queryString);

  var oid = mongoose.Types.ObjectId(queryString.businessId);


//KEEP THIS FOR TESTING
    // UserRequest.promFindOneAndUpdate(
    //   {requestId: 95, 'results.businessId': oid},
    //   {$set: {'results.$.status': 'Pending'}},
    //   {new: true}
    // )

    // UserRequest.promFindOneAndUpdate(
    //   {requestId: 97, 'results.businessId': oid},
    //   {$set: {'results.$.status': 'Pending'}},
    //   {new: true}
    // )

  UserRequest.promFind({'results.businessId': oid})
  .then(function(data){
    var results = misc.parseBusinessOpenRequests(data, oid);
    res.send(200, results);
  })

  // var businessId = req.session.businessId || 1;


  // search through requests collection
  // TODO: filter so not all requests are retrieved...
  // Requests.find(function (err, data) {

  //   console.log('requests:');
  //   console.dir(data);
  //   var results = [];
  //   for (var i = 0; i < data.length; i += 1) {
  //     // look for results property on each document
  //     for (var j = 0; j < data[i].results.length; j += 1) {
  //       // check if document results array has an object with the business id
  //       if (data[i].results[j].businessId === businessId) {
  //         // TODO: or copy entire data[i] object and remove results?
  //         var requestObj = {};
  //         requestObj.address = data[i].address;
  //         requestObj.city = data[i].city;
  //         requestObj.groupSize = data[i].groupSize;
  //         requestObj.requestNotes = data[i].requestNotes;
  //         requestObj.requestId = data[i].requestId;
  //         requestObj.userId = data[i].userId;
  //         requestObj.targetDateTime = data[i].targetDateTime;
  //         results.push(requestObj);
  //       }
  //     }
  //   }
  //   res.send(results);

  // });
}

exports.declineRequests = function(req,res){

  console.log('got to decline requests')
  var data = req.body;

  var businessId = mongoose.Types.ObjectId(data.businessId);


  UserRequest.promFindOneAndUpdate(
    {requestId: data.requestId, 'results.businessId': businessId},
    {$set: {'results.$.status': 'Declined'}},
    {new: true}
  )
  .then(function(data){
    console.log('Successful Reject Update: ', data);
    res.send(201);
  })
};

exports.acceptRequests = function(req,res){

  var data = req.body;

  var businessId = mongoose.Types.ObjectId(data.businessId);


  UserRequest.promFindOneAndUpdate(
    {requestId: data.requestId, 'results.businessId': businessId},
    {$set: {
      'results.$.status': 'Offered',
      'results.$.replies': data.offer
    }},
    {new: true}
  )
  .then(function(data){
    console.log('Successful Accepted Update: ', data);
    res.send(201);
  })
};


exports.showOffers = function (req, res) {
  console.log('inside showOffers');

  // query offers collection, filtering by businessId
  Offer.promFind({businessId: req.session.businessId})
    .then(function (data) {
      if (!data) {
        console.log('no offers found');
      } else {
        console.log('offers found, returning...');
        console.dir(data);
        // return all offers as an array of objects
        res.send(200, data);
      }
    })

    //if there was an issue searching for offers
    .catch(function (e) {
      console.log('offer lookup failed ', e);
      throw e
      res.redirect('/business/dashboard');
    })
}

exports.sendOffer = function (req, res) {

  Offer.promFindOne({requestId: req.body.requestId, businessId: req.session.businessId})

    .then(function (data) {
      //if the offer exists, redirect (cannot reply twice)
      if (data) {
        console.log('offer already exists')

      //otherwise, save the offer
      } else {
        req.body.businessId = req.session.businessId;
        console.dir(req.body);
        new Offer(req.body).save(function (err) {
          if (err) {
            console.log('error when saving new offer');
          } else {
            console.log('offer saved');
          }
        })
      }
      res.redirect('/business/dashboard');
    })

    //if there was an issue searching for offers
    .catch(function (e) {
      console.log('offer lookup failed ', e);
      res.redirect('/business/dashboard');
    })
}
