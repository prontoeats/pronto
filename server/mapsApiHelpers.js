var request = require('request');
var misc = require('./miscHelpers.js');
var request = require('request');
var blue = require('bluebird');
try {
  var config = require('../config.js');
}
catch (e) {
  console.log('did not load config file');
  console.log(e);
}

exports.parseAddress = function(obj){

  var parsedAddress = [];

  if (obj.city) {
    parsedAddress = parsedAddress.concat(obj.address.split(" "),',');
    parsedAddress = parsedAddress.concat(obj.city.split(" "),',');
    parsedAddress = parsedAddress.concat(obj.state.split(" "));
  } else {
    parsedAddress = obj.location.split(' ');
  }

  return parsedAddress.join('+');
};

exports.getGeo = function(obj){

  var parsedAddress = exports.parseAddress(obj);

  var googleUrl = 'https://maps.googleapis.com/maps/api/geocode/json?';
  var sensor = 'sensor=false';
  var key = 'key=' + (process.env.GEOCODEKEY || config.GEOCODEKEY);
  var fullUrl = googleUrl+'address='+parsedAddress+'&'+sensor+'&'+key;

  var reqObj = {
    method: 'GET',
    url: fullUrl
  }

  return misc.request(reqObj);
};

//array is passed in from google with response and body JSON objects
exports.parseGeoResult = function (array) {

  var result = JSON.parse(array[1]);
  result = result.results[0].geometry.location;
  result = [result.lng, result.lat];

  return new blue (function (resolve, reject) {
    resolve(result);
  });
};

exports.convertUserRequestLocation = function(requestObj){

  return new blue(function(resolve, reject){
    if (Array.isArray(requestObj.location)) {
      requestObj.address = 'Current Location';
      resolve();

    } else {
      requestObj.address = requestObj.location;
      exports.getGeo(requestObj)
      .then(exports.parseGeoResult)
      .then(function (result) {
        requestObj.location = result;
        resolve();
      });
    }
  })

};
