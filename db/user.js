var mongoose = require('mongoose');
var blue = require('bluebird');
var prom = require('../server/promisified.js');
var Counter = require('./counter.js').Counter;

var userSchema = mongoose.Schema({
  userId:       {type: Number, index: {unique: true}},
  email:        {type: String, required: true, index: {unique: true}},
  password:     {type: String, required: true},
  firstName:    {type: String, required: true},
  lastName:     {type: String, required: true},
  phoneNumber:  {type: Number, required: true},
  createdAt:    {type: Date, default: Date.now}
});

userSchema.pre('save', function (next) {

  Counter.getCounter('users').bind(this)

    .then(function (data) {
      console.dir(data);
      this.userId = data.counter;
      return prom.bcryptHash(this.password, null, null)
    })

    .then(function (hash) {
      this.password = hash;
      next();
    });

});

var User = mongoose.model('User', userSchema);

// Converting model functions to promisified functions
// User.promFind = blue.promisify(User.find);
User.promFindOne = blue.promisify(User.findOne);

// TODO: 5/22 - given name of function, should just return id number?
// TODO: 5/22 - do we actually need to promisify?
User.promGetUserId = function(username){
  return User.promFindOne({username: username});
};

exports.User = User;
