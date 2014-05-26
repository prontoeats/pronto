var mongoose = require('mongoose');

mongoose.connect('mongodb://groupeat:groupeat@ds030827.mongolab.com:30827/MongoLab-mb');

var db = mongoose.connection;

db.on('error', function(e){
  console.log('Mongoose DB Connection Error: ',e);
});

db.on('open', function(e){
  console.log('Mongoose DB Connection Established.');
});
