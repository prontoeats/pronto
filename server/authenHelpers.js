var User = require('../db/user.js').User;

exports.userCreateSession = function (req){
  req.session.userEmail = req.body.email;
  req.session.userId = req.body.userId;
};

exports.userAuthenticate = function(req, res, next){
  if (req.session.userEmail){
    console.log('User authenticated');
    next();
  } else {
    console.log('User *NOT* authenticated');
    res.redirect('/');
  }
};

exports.busCreateSession = function (req){
  req.session.busEmail = req.body.email;
  req.session.businessId = req.body.businessId;
};

exports.busAuthenticate = function(req, res, next){
  if (req.session.busEmail){
    console.log('Business authenticated');
    next();
  } else {
    console.log('Business *NOT* authenticated');
    res.redirect('/');
  }
};

exports.logout = function(req,res){
  req.session.destroy();
  console.log('Logging out');
  res.redirect('/');
};

exports.authenticateUserToken = function (req, res, next) {
  // search if id === _id in user table
  console.log('Req Body: ', req.body);
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
