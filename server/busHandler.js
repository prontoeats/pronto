
var url = require('url');
var qs = require('querystring');
var Business = require('../db/business.js').Business;
var UserRequest = require('../db/userRequest.js').UserRequest;
var mapApi = require('./mapsApiHelpers.js');
var login = require('./loginHelpers.js');
var mongoose = require('mongoose');
var misc = require('./miscHelpers.js');
var push = require('./pushHelpers.js');
var blue = require('bluebird');

try {
  var config = require('../config.js');
}
catch (e) {
  console.log('did not load config file');
  console.log(e);
}

var yelp = require("yelp").createClient({
  consumer_key:     process.env.YELP_KEY || config.YELP_KEY,
  consumer_secret:  process.env.YELP_SECRET || config.YELP_SECRET,
  token:            process.env.YELP_TOKEN || config.YELP_TOKEN,
  token_secret:     process.env.YELP_TSECRET || config.YELP_TSECRET
});

exports.businessSendAuthFail = function (res){
  res.send(404, 'failed authentication!');
}

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
        res.send(201, {
          accessToken: data.accessToken,
          businessId: data._id,
          signup: false
        });
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
    console.log(businessInfo);
    console.log(businessInfo.address +', '+businessInfo.zipCode);

    var searchObj = {
      term: businessInfo.businessName,
      location: businessInfo.address +', '+businessInfo.zipCode,
      limit: 1
    };
    // What if can't find restauarnt in yelp???
    yelp.search(searchObj, function(error, data) {
      console.log('return data', data);
      if (error){
        console.log('yelp search errer');
        businessInfo.yelpId = 'No_yelp';
      } else{
        businessInfo.yelpId = data.businesses[0].id;
        new Business(businessInfo).save(function (err, data) {
          if (err) {
            console.log('problem saving new business');
            res.send(400);
            throw err;
          }
          // with other information received, save to database
          res.send(201, {accessToken: accessToken, businessId: data._id});
        })
      }
    });
  })
  .catch( function (e) {
    res.send(400);
    throw e;
  });
};

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

  var yelpData = {
    stars: 0,
    review: 0,
    url: ''
  };

  var dateTime = new Date();
  dateTime.setMinutes(dateTime.getMinutes() + 10);

  Business.promFindOne({_id: businessId})
  .then(function(data){
    console.log(data);
    if(data.yelpId === 'No_yelp'){
      return new blue (function(resolve, reject){
        resolve();
      })
    } else {
      return new blue (function(resolve, reject){
        yelp.business(data.yelpId, function(error, data){
          if (error){
            console.log('Yelp ID cannot be found on yelp');
            resolve()

          }else{
            resolve(data);
          }
        });
      });
    }
  })
  .then(function(queryData) {

    if (queryData){
      console.log('business return data:', queryData)
      yelpData.stars = queryData.rating;
      yelpData.review = queryData.review_count;
      yelpData.url = queryData.mobile_url;
      console.log('yelp data:', yelpData);
    }

    return UserRequest.promFindOneAndUpdate(
      {requestId: data.requestId, 'results.businessId': businessId},
      {$set: {
        'results.$.status': 'Offered',
        'results.$.updatedAt': new Date(),
        'results.$.replies': data.offer,
        'results.$.expirationDateTime': dateTime,
        'results.$.yelpStars': yelpData.stars,
        'results.$.yelpReviews': yelpData.review,
        'results.$.yelpUrl': yelpData.url,
      }},
      {new: true}
    )
  })
  .then(function(data){
    console.log('push promise');

    console.log('data in accept requests: ', data.pushNotification);
    console.log('type: ', typeof data.pushNotification);


    if (data.pushNotification.apn.length){
      push.sendApnMessage(
        data.pushNotification.apn,
        'You have a new offer!', {state: 'user.active'}
      );
    }

    if (data.pushNotification.gcm.length){
      push.sendGcmMessage(
        data.pushNotification.gcm,
        'You have a new offer!', 'user.active'
      );

    }

    res.send(201);
  })
  .then(function () {
    console.log('set Time out');
    // if offer is still outstanding (status: offered) after ten minutes
    // convert status to "expired"
    setTimeout(function () {
      UserRequest.promFindOneAndUpdate(
        {
          requestId: data.requestId,
          'results.businessId': businessId,
          'results.status': 'Active'
        },
        {$set: {
          'results.$.status': 'Expired',
          'results.$.updatedAt': new Date()
        }},
        {new: true}
      )
    }, 1000 * 60 * 10);
  });
};

var filterRequests = function (req, res, filter) {

  var queryString = qs.parse(url.parse(req.url).query);
  var oid = mongoose.Types.ObjectId(queryString.businessId);
  console.log('ObjectId(businessId):', oid);

  return UserRequest.promFind({
    requestStatus: {$nin: ['Expired', 'Canceled']},
    'results.businessId': oid
  })
  .then(function(data){
    var results = misc.parseBusinessOpenRequests(data, oid, filter);
    res.send(200, results);
  })

};

exports.showPending = function (req, res) {
  filterRequests(req, res, 'Pending');
};

exports.showOffered = function (req, res) {
  filterRequests(req, res, 'Offered');
};

exports.showAccepted = function (req, res) {
  filterRequests(req, res, 'Accepted');
};

