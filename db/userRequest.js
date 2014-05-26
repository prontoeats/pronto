var mongoose = require('mongoose');
var blue = require('bluebird');
var Counter = require('./counter.js').Counter;

var requestSchema = mongoose.Schema({
  requestId:      {type: Number, index: {unique: true}},
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

requestSchema.pre('save', function (next) {

  if (!this.requestId) {

    Counter.getCounter('requests').bind(this)

      .then(function (data) {
        this.requestId = data.counter;
        next();
      })

      .catch(function (err) {
        throw err;
      });
  }

  next();

});

var UserRequest = mongoose.model('Request', requestSchema);

UserRequest.promFindOneAndUpdate = blue.promisify(UserRequest.findOneAndUpdate);
UserRequest.promFindOne = blue.promisify(UserRequest.findOne);
UserRequest.promFind = blue.promisify(UserRequest.find);

exports.UserRequest = UserRequest;
