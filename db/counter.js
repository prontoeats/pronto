var mongoose = require('mongoose');
var blue = require('bluebird');

var counterSchema = mongoose.Schema({
  tableName:    {type: String, required: true},
  counter:      {type: Number, required: true, default: 0}
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

exports.Counter = Counter;
