
var mongoose = require('mongoose');
var blue = require('bluebird');

var counterSchema = mongoose.Schema({
  counterType: String,
  count: {
    type: Number,
    default: 0
  }
});

// counterSchema.pre('save', function(next){
//   this.count++;
//   next();
// });

var Counter = mongoose.model('Counter', counterSchema);

//Promisify model functions

Counter.promFindOneAndUpdate = blue.promisify(Counter.findOneAndUpdate);

//returns
Counter.getRequestsCounter = function(){
  return Counter.promFindOneAndUpdate(
    {counterType: 'requests'},
    { $inc: {count:1} },
    {new: true,
      select: 'count'}
  );
};

//used to create a new counter if the counter collection is deleted
// // new Counter({counterType: 'requests'}).save();


exports.Counter = Counter;