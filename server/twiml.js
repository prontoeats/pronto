
var UserRequest = require('../db/userRequest.js').UserRequest;
var blue = require('bluebird');

exports.processPost = function(req, res, next){

  var body = parseBody(req.body.Body);

  var query = {
    requestId: body[0],
    'results.phoneNumber': body[1]
  }
  var num = parseNumber(req.body.From);
  var requestId = {requestId: body[0]};
  var offer = body[1];
  var updatedBusinesses;

  UserRequest.promFindOne({requestId: body[0]})
  .then(function(data){
    updatedBusinesses = updateBusiness(data.results, num, offer);

    return new blue(function(resolve, reject){
      resolve(updatedBusinesses);
    })
  })

  .then(function(){
    return UserRequest.promFindOneAndUpdate(
      {requestId: body[0]},
      {$set: {results: updatedBusinesses}},
      {new: true}
    );
  })

  .then(function(data){

    sendXml(res, 'Thanks! We will let the requester know of your offer: '+offer);
  })
};

var updateBusiness = function(str, num, offer){

  var bus = JSON.parse(str);

  for (var i = 0; i<bus.length; i++){
    if (bus[i].phoneNumber*1 === num*1){
      bus[i].status = 'Accepted',
      bus[i].replies = offer;
    }
  }

  return JSON.stringify(bus);
}

var parseNumber = function(from){
  return from.slice(2)*1;
};

var parseBody = function(body){

  var splitBody = body.split('#');

  var offer = splitBody[1];
  var reqId;

  var exp = /[0-9]/g;
  var regExp = new RegExp(exp);
  reqId = splitBody[0].match(regExp).join("")*1;

  return [reqId, offer];
};

var sendXml = function(res,msg){

  var xml = '<?xml version="1.0" encoding="UTF-8" ?><Response><Message>Received: '+msg+'</Message></Response>';
  res.header('Content-Type','text/xml').send(xml);
};

// var test = {}
// test.body={}
// test.body.Body = '(79) # 10%off';
// test.body.From = '+13124794923';

// exports.processPost(test);









