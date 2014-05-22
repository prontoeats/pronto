
var User = require('../db/user.js').User;
var prom = require('./promisified.js');

exports.sendIndex = function (req, res){
  res.sendfile('./views/index.html');
};

exports.sendAuthFail = function (res){
  res.send(404, 'failed authentication!');
}

exports.login = function(req, res){

  User.promFindOne({username: req.body.username})
  .then(function(data){
    return prom.bcryptCompare(req.body.password, data.password)
  })
  .then(function(result){
    if (result){
      res.sendfile('./views/userDashboard.html');
    } else {
      exports.sendAuthFail(res);
    }
  })
  .catch(function(e){
    exports.sendAuthFail(res);
  })

};

exports.signup = function(req, res){

  User.promFindOne({username: req.body.username})
  .then(function(data){
    if(data){
      exports.sendAuthFail(res);
    } else {
      new User(req.body).save(function(err){
        if(err){
          exports.sendAuthFail(res);    
        } else {
          res.sendfile('./views/userDashboard.html');
        }
      });
    }
  })
  .catch(function(e){
    console.log('signup fail: ', e);
    exports.sendAuthFail(res);
  });
};
