var constants = require('./constants.js');
var misc = require('./miscHelpers.js');
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

  misc.request(reqObj)
    .then( function (data) {
      data = JSON.parse(data[1]);
      resolve(data.access_token);
    });
  });
};

exports.getUserInfo = function (token) {

  var getObj = {
    method: 'GET',
    url: constants.Google.people_uri,
    headers: {'Authorization': 'Bearer ' + token}
  };

  return misc.request(getObj)
};
