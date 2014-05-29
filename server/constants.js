exports.Google = {
  authorize: 'https://accounts.google.com/o/oauth2/token',
  people_uri: 'https://www.googleapis.com/plus/v1/people/me',
  client_id: process.env.AUTHID,
  client_secret: process.env.AUTHSECRET,
  redirect_uri: 'http://localhost'
};
