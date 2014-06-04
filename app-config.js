var express = require('express');
var dbConnect = require('./db/db-config.js');
var userHandler = require('./server/userHandler.js');
var busHandler = require('./server/busHandler.js');
var authen = require('./server/authenHelpers.js');

var app = express();

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}

app.configure(function() {
  app.use(express.bodyParser());
  app.use(allowCrossDomain);
});

// public routes
app.post('/login/user', userHandler.login);
app.post('/login/business', busHandler.login);
app.post('/signup/business', busHandler.signup);

// private user routes
app.get('/requests', authen.checkToken, userHandler.sendRequestInfo);
app.post('/token', authen.registerPushToken);
app.post('validate', authen.checkToken, authen.isValidated);
app.post('/request', authen.checkToken, userHandler.request);
app.post('/requests/accept', authen.checkToken, userHandler.acceptOffer);
app.post('/requests/reject', authen.checkToken, userHandler.rejectOffer);

// private business routes
app.get('/business/requests', authen.checkToken, busHandler.showPending);
app.get('/business/offered', authen.checkToken, busHandler.showOffered);
app.get('/business/accepted', authen.checkToken, busHandler.showAccepted);
app.post('/business/token', authen.registerPushToken);
app.post('/business/validate', authen.checkToken, authen.isValidated);
app.post('/business/requests/accept', authen.checkToken, busHandler.acceptRequests);
app.post('/business/requests/decline', authen.checkToken, busHandler.declineRequests);

app.all('*', function (req, res) {
  res.send(404, 'bad route');
});

module.exports = app;
