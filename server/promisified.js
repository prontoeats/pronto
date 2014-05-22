
var blue = require('bluebird');
var bcrypt = require('bcrypt-nodejs');
var request = require('request');

//Promisifying functions
exports.bcryptHash = blue.promisify(bcrypt.hash);
exports.bcryptCompare = blue.promisify(bcrypt.compare);
exports.request = blue.promisify(request);