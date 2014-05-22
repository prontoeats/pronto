
exports.userCreateSession = function (req){
  req.session.userUsername = req.body.username;
};

exports.userAuthenticate = function(req, res, next){

  if (req.session.userUsername){
    next();
  } else {
    res.redirect('/');
  }
};

exports.busCreateSession = function (req){
  req.session.busUsername = req.body.username;
};

exports.busAuthenticate = function(req, res, next){

  if (req.session.busUsername){
    next();
  } else {
    res.redirect('/');
  }
};

exports.logout = function(req,res){
  req.session.destroy();
  res.redirect('/');
};
