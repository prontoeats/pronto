var constants = require('./constants.js');
var prom = require('./promisified.js');
var blue = require('bluebird');

exports.getGoogleToken = function (code) {

  return new blue( function (resolve, reject) {

  var reqObj = {
    method: 'POST',
    url: constants.Google.authorize,
    form: {
      code: code,
      client_id: constants.Google.client_id,
      client_secret: constants.Google.client_secret,
      redirect_uri: constants.Google.redirect_uri,
      grant_type: 'authorization_code'
    }
  };

  prom.request(reqObj)
    // google sends a token back (success callback)
    .then( function (data) {
      console.log('getGoogleToken then');
      data = JSON.parse(data[1]);
      console.dir(data);
      resolve(data.access_token);
    });
  });
}

exports.getUserInfo = function (token) {

  // send token to a different google url to get user information
  var getObj = {
    method: 'GET',
    url: constants.Google.people_uri,
    headers: {'Authorization': 'Bearer ' + token}
  };

  return prom.request(getObj)
}
