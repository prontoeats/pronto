var mongoose = require('mongoose');
var blue = require('bluebird');

var userSchema = mongoose.Schema({
  email:            {type: String, required: true, index: {unique: true}},
  accessToken:      {type: String, required: true},
  firstName:        {type: String, required: true},
  lastName:         {type: String, required: true},
  createdAt:        {type: Date, default: Date.now},
  pushNotification: {
    type: mongoose.Schema.Types.Mixed,
    default: {apn: [], gcm:[]}
  }
});

var User = mongoose.model('User', userSchema);

User.promFindOne = blue.promisify(User.findOne);
User.promFindOneAndUpdate = blue.promisify(User.findOneAndUpdate);

exports.User = User;
