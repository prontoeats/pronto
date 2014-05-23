var mongoose = require('mongoose');
var blue = require('bluebird');
var prom = require('../server/promisified.js');
var mapApi = require('../server/mapsApiHelpers.js')
var Counter = require('./counter.js').Counter;

var businessSchema = mongoose.Schema({
  businessId:   {type: Number, index: {unique: true}},
  email:        {type: String, required: true, index: {unique: true}},
  businessName: {type: String, required: true},
  address:      {type: String, required: true},
  city:         {type: String, required: true},
  state:        {type: String, required: true},
  country:      {type: String, required: true, default: 'US'},
  zipCode:      {type: Number, required: true},
  password:     {type: String, required: true},
  firstName:    {type: String, required: true},
  lastName:     {type: String, required: true},
  phoneNumber:  {type: Number, required: true},
  location:     {type: Array, index: '2dsphere'},
  createdAt:    {type: Date, default: Date.now}
});

// TODO: 5/22 this is redundant with schema delcaration: delete?
// Set up mongoose index for geospatial
// businessSchema.index({location: '2dsphere'});

businessSchema.pre('save', function (next) {

  Counter.getCounter('businesses').bind(this)

    .then(function (data) {
      console.dir(data);
      this.businessId = data.counter;
      return prom.bcryptHash(this.password, null, null)
    })

    .then(function (hash) {
      this.password = hash;
      return this;

      // TODO: 5/22 - confirm this is unnecessary
      // create new promise to continue chain
      // return new blue(function(resolve, request){
      //   resolve(that);
      // })
    })

    //get Geo location from google maps
    .then(mapApi.getGeo)

    //convert response to Long/Lat
    .then(mapApi.parseGeoResult)

    //update Long/Lat coordinates to location
    .then(function (result) {
      this.location = result;
      next();
    })

});

var Business = mongoose.model('Business', businessSchema);

// converting model functions to promisified functions
// Business.promFind = blue.promisify(Business.find);
Business.promFindOne = blue.promisify(Business.findOne);
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
