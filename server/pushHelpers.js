
var gcm = require('node-gcm');
var http = require('http');
var apn = require('apn');
var url = require('url');


exports.sendApnMessage = function(array, body, payload){

  var callback = function(errNum, notification){
      console.log('APN Connection error is :', errNum);
      console.log('APN Note: ', notification);
  };

  var options = {
      gateway: 'gateway.sandbox.push.apple.com', // this URL is different for Apple's Production Servers and changes when you go to production
      errorCallback: callback,
      cert: './server/ProntoPush.pem',
      key:  './server/ProntoPushKey.pem',
      passphrase: 'prontopush',
      port: 2195,
      enhanced: true,
      cacheLength: 100
  };

  var apnConnection = new apn.Connection(options);

  for (var i = 0; i<array.length; i++){
      var device = new apn.Device(array[i]);
      var message = new apn.Notification();

      message.sound = 'notification-beep.wav';
      message.alert = {body: body};
      message.payload = payload;
      message.device = device;

      apnConnection.sendNotification(message);
  }
};

exports.sendGcmMessage = function(array, message){


  console.log('got to send Gcm Message', array, message);

  var message = new gcm.Message();
   
  //API Server Key
  var sender = new gcm.Sender('AIzaSyBoZh3lZwR1j-XU_mwjP-GMSqPcYQ-JRpY');
  var registrationIds = array;
   
  // Value the payload data to send...
  message.addData('message', message);
  message.addData('title','Pronto' );
  // message.addData('msgcnt','3'); // Shows up in the notification in the status bar
  // message.addData('soundname','beep.wav'); //Sound to play upon notification receipt - put in the www folder in app
  //message.collapseKey = 'demo';
  //message.delayWhileIdle = true; //Default is false
  message.timeToLive = 3000;// Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.
      
  /**
   * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
   */
  sender.send(message, registrationIds, 4, function (result) {
      console.log('gcm send result:', result);
  });
}
