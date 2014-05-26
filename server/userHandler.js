var url = require('url');

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
exports.sendIndex = function (req, res){
  res.sendfile('./views/index.html');
};

exports.sendAbout = function(req, res){
  res.sendfile('./public/html/about.html');  
}
exports.sendAuthFail = function (res){
  res.send(404, 'failed authentication!');
};

exports.dashboard = function(req, res, next){
  res.sendfile('./public/html/userDash.html');
};

exports.login = function(req, res){

  //Find the account that matches the username
  User.promFindOne({username: req.body.username})
  .then(function(data){

    //return a promise to continue the chain - promise will be resolved
    //once bcrypt completes the comparison
    return prom.bcryptCompare(req.body.password, data.password)
  })

  //check the results of the comparison
  .then(function(result){

    //if the passwords match - direct to the user dashboard
    if (result){
      authen.userCreateSession(req);
      res.redirect(302,'/dashboard');

    //if the passwords don't match redirect
    } else {
      console.log('user password do not match')
      exports.sendAuthFail(res);
    }
  })

  //if the account does not already exist redirect
  .catch(function(e){
    console.log('user didnt find username');   
    exports.sendAuthFail(res);
  })
};

exports.signup = function(req, res){

  console.log('got to user signup');
  //check to see if user username exists in database
  User.promFindOne({username: req.body.username})
  .then(function(data){

    //if the user username exists, redirect
    if(data){
      console.log('user username already exists')
      exports.sendAuthFail(res);

    //otherwise, save the user account into the database and redirect to user dashboard
    } else {
      new User(req.body).save(function(err){
        if(err){
          console.log('issue saving new user account');
          exports.sendAuthFail(res);    
        } else {
          authen.userCreateSession(req);
          res.redirect(302,'/dashboard');
        }
      });
    }
  })

  //if there was an issue searching for the user, redirect
  .catch(function(e){
    console.log('signup fail: ', e);
    exports.sendAuthFail(res);
  });
};

exports.request = function(req,res){

  console.log('received data: ',req.body);
  
  // console.log('url parse: ', req.url);
  //parse the request form data
  var parsed = misc.parseRequestFormData(req.body);
  var requestObj;
  var numbers;

  //get userId of requestor
  User.promGetUserId(req.session.userUsername)

  //update the parsed object info with the requestorId
  .then(function(data){
    parsed.requesterId = data._id; //NOTE: may have issues later since we saved the id as a string

    //start another promise to keep the chain going
    return new blue(function(resolve, reject){
      resolve(req.session.userUsername);
    });
  })

  //get the next request counter number
  .then(Counter.getRequestsCounter)

  //update the parsed object info with the request counter
  .then(function(data){
    parsed.requestId = data.count;
    requestObj = new UserRequest(parsed);

    //promisifying the save function
    requestObj.promSave = blue.promisify(requestObj.save);

    return requestObj.promSave();
  })

  //create new promise to continue chain
  .then(function(){
    return new blue(function(resolve,reject){
      resolve(parsed);
    })
  })

  //get Long/Lat from google maps
  .then(mapApi.getGeo)

  //convert response to Long/Lat
  .then(mapApi.parseGeoResult)

  //add long/lat results to location parameter on obj and save
  .then(function(result){
    requestObj.location = result;

    return requestObj.promSave();
  })

  //create new promise to continue chain
  .then(function(){
    return new blue (function(resolve, reject){
      resolve([requestObj.location, requestObj.radius]);
    })
  })

  //find businesses nearby the request location
  .then(Business.promFindNearby)

  //parse and format the data
  .then(misc.parseNearbyData)

  //store the data as a parameter on the request Obj and save
  .then(function(data){
    requestObj.businesses = JSON.stringify(data[0]);
    numbers = data[1];
    return requestObj.promSave();
  })

  //create new promise to continue chain
  .then(function(){
    return new blue (function(resolve, reject){
      resolve([numbers, requestObj]);
    });
  })

  //send text messages
  .then(twilio.massTwilSend);

  res.send(200); 
};

exports.sendRequestInfo = function(req,res){

    console.log('url parse: ', req.url);
        res.send(200);


  //get username from session info
  var username = req.session.userUsername;

  //get userID
  User.promFindOne({username: username})
  
  //find records for that userId
  .then(function(data){
    return UserRequest.promFind({requesterId: data._id})
  })

  .then(function(data){

    return new blue(function(resolve, reject){
      resolve(misc.sendRequestInfoParser(data));
    })
  })
  .then(function(data){
    res.send(200, data);
  })
};

exports.acceptOffer = function(req,res){
  res.send(201);

  UserRequest.promFindOne({requestId: req.body.requestId})
  .then(function(data){
    var number = misc.acceptOfferProcessing(data.businesses, req.body.businessName);

    twilio.sendConfirmation(number,data.requestId, data.groupSize, data.targetDateTime);
  })
};