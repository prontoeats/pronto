var gcm = require('node-gcm');
var apn = require('apn');
try {
  var config = require('../config.js');
}
catch (e) {
  console.log('did not load config file');
  console.log(e);
}

exports.sendApnMessage = function(array, body, payload){

  var callback = function(errNum, notification){
      console.log('APN Connection error is :', errNum);
      console.log('APN Note: ', notification);
  };

  var options = {
      // TODO: update gateway to Apple's Production Servers for production
      gateway: 'gateway.sandbox.push.apple.com',
      errorCallback: callback,
      cert: './server/ProntoPush.pem',
      key: './server/ProntoPushKey.pem',
      passphrase: 'prontopush',
      port: 2195,
      enhanced: true,
      cacheLength: 100
  };

  var apnConnection = new apn.Connection(options);

  for (var i = 0; i<array.length; i++){
      var device = new apn.Device(array[i]);
      var message = new apn.Notification();

      message.sound   = 'notification-beep.wav';
      message.alert   = {body: body};
      message.payload = payload;
      message.device  = device;

      apnConnection.sendNotification(message);
  }
};

exports.sendGcmMessage = function(array, message, state){

  message = new gcm.Message();
  var sender = new gcm.Sender(process.env.GCM_KEY || config.GCM_KEY);
  var registrationIds = array;

  message.addData('message', message);
  message.addData('title','Pronto' );
  message.addData('state', state);
  message.timeToLive = 3000;

  sender.send(message, registrationIds, 4, function (result) {
      console.log('gcm send result:', result);
  });
}
