
var express = require('express');
var twiml = require('./server/twiml.js')
var dbConnect = require('./db/db-config.js');
var userHandler = require('./server/userHandler.js');
var busHandler = require('./server/busHandler.js');
var authen = require('./server/authenHelpers.js');
var app = express();

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

// view engine setup
app.configure(function() {
  // app.set('views', __dirname + '/views');
  // app.set('view engine', 'ejs');
  // app.use(partials());
  app.use(express.bodyParser());
  app.use('/bower_components', express.static(__dirname + '/bower_components'));
  app.use(express.static(__dirname + '/public'));
  app.use(allowCrossDomain);
  app.use(express.cookieParser('shhhh, very secret'));
  app.use(express.session());
});

//Public user routes
app.get('/', userHandler.sendIndex);
app.get('/logout', authen.logout);
// app.get('/about', userHandler.sendAbout);
app.post('/login/user', userHandler.login);
// app.post('/signup', userHandler.signup);

//Public business routes
app.get('/business', busHandler.sendBusIndex);
app.post('/login/business', busHandler.login);
app.post('/signup/business', busHandler.signup);
// app.post('/business/signup', busHandler.signup);

app.post('/twilio', twiml.processPost);

//routes requiring authentication
app.get('/requests', userHandler.sendRequestInfo);
app.post('/acceptOffer', authen.userAuthenticate, userHandler.acceptOffer);
app.get('/dashboard', authen.userAuthenticate, userHandler.dashboard);
app.post('/request', userHandler.request);

app.get('/business/dashboard', authen.busAuthenticate, busHandler.dashboard);
// TODO: enable authentication after MVP
app.get('/business/requests', busHandler.showRequests);
app.get('/business/offers', busHandler.showOffers);
app.post('/business/offers', busHandler.sendOffer);

module.exports = app;
