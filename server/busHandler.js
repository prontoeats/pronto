var Business = require('../db/business.js').Business;
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

  //Find the account that matches the username
  Business.promFindOne({email: req.body.email})
    .then(function(data){

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
