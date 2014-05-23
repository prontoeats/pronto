var mongoose = require('mongoose');
var blue = require('bluebird');

var counterSchema = mongoose.Schema({
  tableName:    {type: String},
  counter:      {type: Number, default: 0}
});

var Counter = mongoose.model('Counter', counterSchema);

Counter.promFindOneAndUpdate = blue.promisify(Counter.findOneAndUpdate);

Counter.getCounter = function (tableName) {
  return Counter.promFindOneAndUpdate(
    // conditions
    {tableName: tableName},
    // update: increases counter field by 1)
    {$inc: {counter: 1}},
    // options: returns modified document, creates if DNE, return counter
    {new: true, upsert: true, select: 'counter'}
  );
}

Counter.getCounter('vendors');

exports.Counter = Counter;

//used to create a new counter if the counter collection is deleted
// // new Counter({tableName: 'requests'}).save();

//returns
// Counter.getRequestsCounter = function(){
//   return Counter.promFindOneAndUpdate(
//     {tableName: 'requests'},
//     { $inc: {counter:1} },
//     {new: true,
//       select: 'counter'}
//   );
// };

// counterSchema.pre('save', function(next){
//   this.counter++;
//   next();
// });
