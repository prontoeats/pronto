var mongoose = require('mongoose');
var blue = require('bluebird');

var requestSchema = mongoose.Schema({
  requestId:      {type: Number, required: true},
  userId:         {type: Number, required: true},
  active:         {type: Boolean},
  targetDateTime: {type: Date, required: true},
  groupSize:      {type: Number, required: true},
  requestNotes:   {type: String},
  address:        {type: String, required: true},
  city:           {type: String, required: true},
  state:          {type: String, required: true},
  country:        {type: String, required: true, default: 'US'},
  radius:         {type: Number, required: true},
  results:        {type: mongoose.Schema.Types.Mixed},
  location:       {type: Array, index: '2dsphere'},
  createdAt:      {type: Date, default: Date.now}
});

var UserRequest = mongoose.model('Request', requestSchema);

UserRequest.promFindOneAndUpdate = blue.promisify(UserRequest.findOneAndUpdate);
UserRequest.promFindOne = blue.promisify(UserRequest.findOne);
UserRequest.promFind = blue.promisify(UserRequest.find);

exports.UserRequest = UserRequest;
