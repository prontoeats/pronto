var mongoose = require('mongoose');
var blue = require('bluebird');
var Counter = require('./counter.js').Counter;

var requestSchema = mongoose.Schema({
  requestId:      {type: Number, index: {unique: true}},
  userId:         {type: String, required: true},
  targetDateTime: {type: Date, required: true},
  mins:           {type: Number, required: true},
  groupSize:      {type: Number, required: true},
  radius:         {type: Number, required: true},
  address:        {type: String},
  country:        {type: String, default: 'US'},
  requestStatus:  {type: String, default: 'Active'},
  results:        {type: mongoose.Schema.Types.Mixed},
  location:       {type: Array, index: '2dsphere'},
  createdAt:      {type: Date, default: Date.now}
});

// requestSchema.pre('save', function (next) {

//   if (!this.requestId) {

//     Counter.getCounter('requests').bind(this)

//       .then(function (data) {
//         this.requestId = data.counter;
//         next();
//       })

//       .catch(function (err) {
//         throw err;
//       });
//   }

//   next();

// });

var UserRequest = mongoose.model('Request', requestSchema);

UserRequest.promFindOneAndUpdate = blue.promisify(UserRequest.findOneAndUpdate);
UserRequest.promFindOne = blue.promisify(UserRequest.findOne);
UserRequest.promFind = blue.promisify(UserRequest.find);

exports.UserRequest = UserRequest;
