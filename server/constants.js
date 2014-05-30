try {
  var config = require('../config.js');
}
catch (e) {
  console.log('did not load config file');
  console.log(e);
}

exports.Google = {
  authorize: 'https://accounts.google.com/o/oauth2/token',
  people_uri: 'https://www.googleapis.com/plus/v1/people/me',
  client_id: process.env.AUTHID || config.AUTHID,
  client_secret: process.env.AUTHSECRET || config.AUTHSECRET,
  redirect_uri: 'http://localhost'
};
