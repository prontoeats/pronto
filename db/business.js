
var mongoose = require('mongoose');
var prom = require('../server/promisified.js');
var blue = require('bluebird');
var mapApi = require('../server/mapsApiHelpers.js')

var businessSchema = mongoose.Schema({
  businessName: 
    {type: String,required: true},
  address: 
    {type: String,required: true},
  city: 
    {type: String,required: true},
  state: 
    {type: String,required: true},
  zipCode: 
    {type: Number,required: true},
  location:
    {type: Array, index: '2dsphere'}, //Store long, lat in Mongo -- Google gives it in lat, long
  username: 
    {type: String,required: true},
  password: 
    {type: String,required: true},
  firstName: 
    {type: String,required: true},
  lastName: 
    {type: String,required: true},
  phoneNumber: 
    {type: Number,required: true},
  email: 
    {type: String,required: true},
  createdAt: 
    {type: Date,default: Date.now}
});

//Set up mongoose index for geospatial
businessSchema.index({location: '2dsphere'});


//bcrypt password and get geolocation before saving into db
businessSchema.pre('save', function(next){

  var that = this;

  //bcrypt the password and store to password property
  prom.bcryptHash(this.password, null, null)
  .then(function(hash){
    that.password=hash;

    //create new promise to continue chain
    return new blue(function(resolve, request){
      resolve(that);
    });
  })

  //get Geo location from google maps
  .then(mapApi.getGeo)

  //convert response to Long/Lat
  .then(mapApi.parseGeoResult)

  //update Long/Lat coordinates to location
  .then(function(result){
    that.location = result;

    //move forward with saving
    next();
  })
});

var Business = mongoose.model('groupEatBusiness', businessSchema);

//converting model functions to promisified functions
Business.promFind = blue.promisify(Business.find);
Business.promFindOne = blue.promisify(Business.findOne);
Business.blueAggregate = blue.promisify(Business.aggregate);

//argsArray contains 2 items: an Array of lon/lat coordinates and the radius
Business.promFindNearby = function(argsArray){

  //get long/lat coordinates and max distance in miles
  location = argsArray[0];
  maxDist = argsArray[1];

  //Converting miles to radians. 3963 is the radius of the earth
  convertedDistance = maxDist/3963; 

  //return a promise that provides an array of restaurants that meet search criteria
  return Business.blueAggregate([{
    $geoNear: {
      near: location,
      distanceField: 'dist.calculated',
      maxDistance: convertedDistance,
      spherical: true
    }
  }]);
};

// 

exports.Business = Business;

