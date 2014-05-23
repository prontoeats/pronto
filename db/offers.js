var mongoose = require('mongoose');
var blue = require('bluebird');
var Counter = require('./counter.js').Counter;

var offerSchema = mongoose.Schema({
  offerId:        {type: Number, index: {unique: true}},
  requestId:      {type: Number, required: true, index: true},
  businessId:     {type: Number, required: true, index: true},
  offer:          {type: String, required: true},
  active:         {type: Boolean, default: true},
  accepted:       {type: Boolean, default: false},
  createdAt:      {type: Date, default: Date.now}
});

offerSchema.pre('save', function (next) {
  console.log('inside offer pre save');
  if (!this.offerId) {

    Counter.getCounter('offers').bind(this)

      .then(function (data) {
        this.offerId = data.counter;
        next();
      })

      .catch(function (err) {
        throw err;
      });
  }

  next();

});

var Offer = mongoose.model('Offer', offerSchema);

Offer.promFindOneAndUpdate = blue.promisify(Offer.findOneAndUpdate);
Offer.promFindOne = blue.promisify(Offer.findOne);
Offer.promFind = blue.promisify(Offer.find);

exports.Offer = Offer;
