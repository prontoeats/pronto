
var mongoose = require('mongoose');
var prom = require('../server/promisified.js');
var blue = require('bluebird');

var userSchema = mongoose.Schema({
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

//Pre to hash the password before saving
userSchema.pre('save', function(next){
  var that = this;

  prom.bcryptHash(this.password, null, null)
  .then(function(hash){
    that.password=hash;
    next();
  });
});

var User = mongoose.model('groupEatUsers', userSchema);

//Converting model functions to promisified functions
User.promFind = blue.promisify(User.find);
User.promFindOne = blue.promisify(User.findOne);

User.promGetUserId = function(username){

  return User.promFindOne({username: username});
};

exports.User = User;
