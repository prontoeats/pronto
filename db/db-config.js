var mongoose = require('mongoose');
try {
  var config = require('../config.js');
}
catch (e) {
  console.log('did not load config file');
  console.log(e);
}

mongoose.connect(process.env.MONGO_CREDENTIALS || config.MONGO_CREDENTIALS);

var db = mongoose.connection;

db.on('error', function(e){
  console.log('Mongoose DB Connection Error: ',e);
});

db.on('open', function(e){
  console.log('Mongoose DB Connection Established.');
});
