var request = require('request');
var prom = require('./promisified.js');
var blue = require('bluebird');

exports.parseAddress = function(obj){

  var parsedAddress = [];

  if (obj.city) {
    //parse the response body object and format the address (for businesses)
    parsedAddress = parsedAddress.concat(obj.address.split(" "),',');
    parsedAddress = parsedAddress.concat(obj.city.split(" "),',');
    parsedAddress = parsedAddress.concat(obj.state.split(" "));
  } else {
    parsedAddress = obj.location.split(' '); // for user requests
  }

  return parsedAddress.join('+');
};

exports.getGeo = function(obj){

  var parsedAddress = exports.parseAddress(obj);

  //format the request url
  var googleUrl = 'https://maps.googleapis.com/maps/api/geocode/json?';
  var sensor = 'sensor=false';
  var key = 'key=AIzaSyAeJONHdaYxuuLrpJ4yg9owBH3ZzVqXfP0'
  var fullUrl = googleUrl+'address='+parsedAddress+'&'+sensor+'&'+key;

  //assemble to request options object
  var reqObj = {
    method: 'GET',
    url: fullUrl
  }

  //bluebird will put both the response and body objects in an array and pass to next function
  return prom.request(reqObj);
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
      mapApi.getGeo(requestObj)
      .then(mapApi.parseGeoResult)
      .then(function (result) {
        requestObj.location = result;
        resolve();
      });
    }    
})



}
