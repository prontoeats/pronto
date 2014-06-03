var mongoose = require('mongoose');
var blue = require('bluebird');
var mapApi = require('../server/mapsApiHelpers.js')

var businessSchema = mongoose.Schema({
  email:        {type: String, required: true, index: {unique: true}},
  businessName: {type: String, required: true},
  address:      {type: String, required: true},
  city:         {type: String, required: true},
  state:        {type: String, required: true},
  country:      {type: String, required: true, default: 'US'},
  zipCode:      {type: Number, required: true},
  firstName:    {type: String, required: true},
  lastName:     {type: String, required: true},
  phoneNumber:  {type: Number, required: true},
  accessToken:  {type: String, required: true},
  yelpId:       {type: String, required: true},
  pushNotification: {
    type: mongoose.Schema.Types.Mixed,
    default: {apn: [],gcm:[]}
  },
  location:     {type: Array, index: '2dsphere'},
  createdAt:    {type: Date, default: Date.now}
});

businessSchema.pre('save', function (next) {

  //get Geo location from google maps
  var that = this;
  mapApi.getGeo(this)

  //convert response to Long/Lat
  .then(mapApi.parseGeoResult)

  //update Long/Lat coordinates to location
  .then(function (result) {
    that.location = result;
    next();
  })

  .catch(function (err) {
    throw err;
  });
});

var Business = mongoose.model('Business', businessSchema);

Business.promFindOne = blue.promisify(Business.findOne);
Business.promFindOneAndUpdate = blue.promisify(Business.findOneAndUpdate);
Business.promAggregate = blue.promisify(Business.aggregate);

// argsArray contains 2 items: an Array of long/lat coordinates and the radius
Business.promFindNearby = function(argsArray){

  // get long/lat coordinates and max distance in miles
  location = argsArray[0];
  maxDist = argsArray[1];

  // Converting miles to radians. 3963 is the radius of the earth
  convertedDistance = maxDist/3963;

  // return a promise that provides an array of restaurants that meet search criteria
  return Business.promAggregate([{
    $geoNear: {
      near: location,
      distanceField: 'dist.calculated',
      maxDistance: convertedDistance,
      spherical: true
    }
  }]);
};

exports.Business = Business;
