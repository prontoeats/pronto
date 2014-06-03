
var blue = require('bluebird');
var request = require('request');

exports.request = blue.promisify(request);
