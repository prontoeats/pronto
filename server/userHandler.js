
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
  var code = req.body.code || '4/40BgwsT5hUDRO72YCdGgZoKQpWWG.4gfjZP0ZRagWEnp6UAPFm0HUuaF1jAI';
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

  var requestObj = req.body; // make sure Joe sends id back as "userId"

  //convert minutes to time
  var dateTime = new Date();
  dateTime.setMinutes(dateTime.getMinutes() + Number(requestObj.mins));
  requestObj.targetDateTime = dateTime;

  // TODO: wrap this if/else statement in a promise itself
  // and then have a resolve point in the "if" and "else" sections

  mapApi.convertUserRequestLocation(requestObj)

  // create new request
  .then(function () {
    request = new UserRequest(requestObj);

    //promisifying the save function
    request.promSave = blue.promisify(request.save);
    return request.promSave();
  })



  
  // var parsed = misc.parseRequestFormData(req.body);
  // var numbers;

  // // get userId of requestor through email
  // // TODO: store user ID in session (with email) to avoid this lookup
  // User.promGetUserId(req.session.userEmail)

  //   //update the parsed object info with the requestorId
  //   .then(function (data){
  //     parsed.userId = data.userId;

  //     // TODO: do not need userEmail in next 'then', so no need for this?
  //     //start another promise to keep the chain going
  //     return new blue(function (resolve, reject) {
  //       resolve(req.session.userEmail);
  //     });
  //   })

  //   //get the next request counter number
  //   // .then(Counter.getRequestsCounter)
  //   // .then(Counter.getCounter('requests'))

  //   //update the parsed object info with the request counter
  //   .then(function (data) {
  //     // parsed.requestId = data.counter;
  //     requestObj = new UserRequest(parsed);

  //     //promisifying the save function
  //     requestObj.promSave = blue.promisify(requestObj.save);
  //     return requestObj.promSave();
  //   })

  //   //create new promise to continue chain
  //   .then(function () {
  //     return new blue(function (resolve, reject) {
  //       resolve(parsed);
  //     })
  //   })

  //   //get Long/Lat from google maps
  //   .then(mapApi.getGeo)

  //   //convert response to Long/Lat
  //   .then(mapApi.parseGeoResult)

  //   //add long/lat results to location parameter on obj and save
  //   .then(function(result){
  //     requestObj.location = result;
  //     return requestObj.promSave();
  //   })

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
      request.results = data;
      // numbers = data[1];
      return request.promSave();
    })

    //create new promise to continue chain
    // .then(function(){
    //   return new blue (function(resolve, reject){
    //     resolve([numbers, requestObj]);
    //   });
    // })

    //send text messages
    // .then(twilio.massTwilSend);
  .then(function(){
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

  // //get email from session info
  // var email = req.session.userEmail;
  // console.log('url parse: ', req.url);


  // //get username from session info
  // var username = req.session.userUsername;

  // //get userID
  // User.promFindOne({email: email})

  //   //find records for that userId
  //   .then(function (data) {
  //     return UserRequest.promFind({userId: data.userId})
  //   })

  //   .then(function(data){
  //     return new blue(function (resolve, reject) {
  //       resolve(misc.sendRequestInfoParser(data));
  //     })
  //   })

  //   .then(function (data){
  //     res.send(200, data);
  //   })
  
};

exports.acceptOffer = function(req,res){
  res.send(201);

  UserRequest.promFindOne({requestId: req.body.requestId})
    .then(function(data){
      var number = misc.acceptOfferProcessing(data.results, req.body.businessName);

      twilio.sendConfirmation(number,data.requestId, data.groupSize, data.targetDateTime);
    })
};
