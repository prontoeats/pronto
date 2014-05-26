
var express = require('express');
var twiml = require('./server/twiml.js')
var dbConnect = require('./db/db-config.js');
var userHandler = require('./server/userHandler.js');
var busHandler = require('./server/busHandler.js');
var authen = require('./server/authenHelpers.js');
var app = express();

app.use(express.bodyParser());
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use(express.static(__dirname + '/public'));
app.use(express.cookieParser('shhhh, very secret'));
app.use(express.session());

//Public user routes
app.get('/', userHandler.sendIndex);
app.get('/logout', authen.logout);
app.get('/about', userHandler.sendAbout);
app.post('/login', userHandler.login);
app.post('/signup', userHandler.signup);

//Public business routes
app.get('/business', busHandler.sendBusIndex);
app.post('/business/login', busHandler.login);
app.post('/business/signup', busHandler.signup);

app.post('/twilio', twiml.processPost);

// user routes requiring authentication
app.get('/dashboard', authen.userAuthenticate, userHandler.dashboard);
app.post('/request', authen.userAuthenticate, userHandler.request);
app.get('/requests', authen.userAuthenticate, userHandler.sendRequestInfo);
app.post('/acceptOffer', authen.userAuthenticate, userHandler.acceptOffer);

// business routes requiring authentication
app.get('/business/dashboard', authen.busAuthenticate, busHandler.dashboard);
// TODO: enable authentication after MVP
app.get('/business/requests', busHandler.showRequests);
app.get('/business/offers', busHandler.showOffers);
app.post('/business/offers', busHandler.sendOffer);

module.exports = app;
