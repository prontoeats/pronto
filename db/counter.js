var mongoose = require('mongoose');
var blue = require('bluebird');

var counterSchema = mongoose.Schema({
  modelName:    {type: String},
  counter:      {type: Number, default: 0}
});

// counterSchema.pre('save', function(next){
//   this.counter++;
//   next();
// });

var Counter = mongoose.model('Counter', counterSchema);

//Promisify model functions

Counter.promFindOneAndUpdate = blue.promisify(Counter.findOneAndUpdate);

//returns
Counter.getRequestsCounter = function(){
  return Counter.promFindOneAndUpdate(
    {modelName: 'requests'},
    { $inc: {counter:1} },
    {new: true,
      select: 'counter'}
  );
};

//used to create a new counter if the counter collection is deleted
// // new Counter({modelName: 'requests'}).save();


exports.Counter = Counter;
