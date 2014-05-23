
exports.userCreateSession = function (req){
  req.session.userEmail = req.body.email;
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
