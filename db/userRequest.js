
var mongoose = require('mongoose');
var blue = require('bluebird');


var requestSchema = mongoose.Schema({

  requestId: 
    {type: Number,required: true},
  requesterId: 
    {type: mongoose.Schema.Types.Mixed,required: true},    
  active: 
    {type: Boolean},
  targetDateTime: 
    {type: Date,required: true},
  groupSize:
    {type: Number,required: true},
  requestNotes:
    {type: String},
  address: 
    {type: String,required: true},
  city: 
    {type: String,required: true},
  state: 
    {type: String,required: true},
  radius: 
    {type: Number,required: true},
  createdAt: 
    {type: Date,default: Date.now},
  businesses: 
    {type:String},
  location:
    {type: Array, index: '2dsphere'} //Store long, lat in Mongo -- Google gives it in lat, long

});


var UserRequest = mongoose.model('UserRequest', requestSchema);

UserRequest.promFindOneAndUpdate = blue.promisify(UserRequest.findOneAndUpdate);
UserRequest.promFindOne = blue.promisify(UserRequest.findOne);
UserRequest.promFind = blue.promisify(UserRequest.find);

exports.UserRequest = UserRequest;








