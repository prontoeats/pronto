
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
