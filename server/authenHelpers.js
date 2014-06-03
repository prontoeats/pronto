var User = require('../db/user.js').User;

exports.logout = function(req,res){
  req.session.destroy();
  console.log('Logging out');
  res.redirect('/');
};

exports.authenticateUserToken = function (req, res, next) {
  // search if id === _id in user table
  User.promFindOne({_id: req.body.userId})
  .then( function (data) {
    // no record
    if (data === null) {
      console.log('no user by that id found');
      res.send(400);
    // record exists
    } else {
      // check if token matches for found user
      if (data.accessToken === req.body.accessToken) {
        console.log('user found, token matches user...proceed');
        next();
      } else {
        console.log('Token in DB: ', data.accessToken);
        console.log('user found, but token does not match that user');
        res.send(400);
      }
    }
  })
};
