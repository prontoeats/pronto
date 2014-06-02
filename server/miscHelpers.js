
var blue = require('bluebird');
var mongoose = require('mongoose');


exports.parseNearbyData = function (array) {
  var allBus = [];
  var apn = [];
  var gcm = [];
  var bus;
  // var phoneNums = [];

  for (var i = 0; i < array.length; i++) {
    bus = {};
    bus.businessId = array[i]._id;
    bus.phoneNumber = array[i].phoneNumber;
    bus.distance = array[i].dist.calculated * 3963;
    bus.status = 'Pending';
    bus.replies = null;
    bus.businessName = array[i].businessName;
    bus.address = array[i].address;
    bus.city = array[i].city;
    bus.state = array[i].state;
    bus.updatedAt = new Date();

    bus.pushNotification = array[i].pushNotification;
    console.log('push notifications', bus.pushNotification);

    if (bus.pushNotification.apn.length){
      apn = apn.concat(bus.pushNotification.apn);
    }

    console.log('pushnotification gcm: ', bus.pushNotification.gcm);
    if (bus.pushNotification.gcm.length){
      gcm = gcm.concat(bus.pushNotification.gcm);
    }

    allBus.push(bus);
  }

  return new blue(function (resolve, reject) {
    resolve([allBus, apn, gcm]);
  });

};

exports.parseRequestFormData = function (obj) {

  var dateTime = new Date();
  dateTime.setMinutes(dateTime.getMinutes() + Number(obj.targetTime));

  var parsedObj = {
    targetDateTime: dateTime,
    groupSize: obj.groupSize,
    address: obj.address,
    city: obj.city,
    state: obj.state,
    radius: obj.radius,
    active: true
  }

  return parsedObj;
 };

exports.formatDate = function (date) {
  var month = date.getMonth() + 1;
  var day = date.getDate() + 1;
  var hours = date.getHours();
  var min = date.getMinutes();

  return month + '/' + day + ' @ ' + hours + ':' + min;
};

exports.sendRequestInfoParser = function (array) {
  // TODO: investigate!!!
  array = array || [];
  var resultsArray = [];
  var obj;

  for (var i = 0; i < array.length; i++){
    obj = {};
    obj.requestId = array[i].requestId;
    obj.targetDateTime = array[i].targetDateTime;
    obj.groupSize = array[i].groupSize;
    obj.requestNotes = array[i].requestNotes;
    obj.results = exports.parseBusinessesData(array[i].results);
    resultsArray.push(obj);
  }

  return resultsArray;

};

exports.parseBusinessesData = function (parsed) {
  // TODO: investigate!!!
  parsed = parsed || [];
  var results = [];
  var business;

  for (var i = 0; i < parsed.length; i++){
    business = {};

    if (parsed[i].status === 'Accepted'){
      business.businessName = parsed[i].businessName;
      business.address = parsed[i].address;
      business.city = parsed[i].city;
      business.state = parsed[i].state;
      business.distance = parsed[i].distance;
      business.offer = parsed[i].replies;

      results.push(business);
    }
  }

  return results;
};

exports.acceptOfferProcessing = function(parsed, restaurant){

  for (var i = 0; i < parsed.length; i++) {
    if (parsed[i].businessName === restaurant){
      return parsed[i].phoneNumber;
    }
  }
};

exports.parseBusinessOpenRequests = function(array, businessId, status){

  var results = [];
  var obj;

  var request;
  var business;


  for (var i=0; i<array.length; i++){
    request = array[i];
    for (var y=0; y<request.results.length; y++){
      business = array[i].results[y];
      if( (business.businessId+'' === businessId+'') && (business.status === status)){
        obj = request;
        obj.results=[business];
        results.push(obj);
      }
    }
  }
  return results;
}
