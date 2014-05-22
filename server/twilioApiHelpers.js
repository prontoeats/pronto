
var twilioAccountSid = 'ACa7d714bdc28de2aeea0670a56891699b';
var twilioAuthToken = 'fb21f4ea443e2a2dabec472c31400ea1';
var twilio = require('twilio')(twilioAccountSid, twilioAuthToken);
var misc = require('./miscHelpers.js');

var prom = require('./promisified.js');
var blue = require('bluebird');

var promTwilSend = blue.promisify(twilio.messages.create);

//promise will pass in an array containing a list of numbers and the request object
exports.massTwilSend = function(array){

  var numbers = array[0];
  var obj = array[1];
  var formattedNumber;
  var formattedDate = misc.formatDate(obj.targetDateTime);

  var message = 'ID: ('+obj.requestId+') - Group of '+obj.groupSize+ ' on '+ formattedDate+'. Notes: '+obj.requestNotes
                +'. To make an offer, reply with ('+obj.requestId+') # and your offer. Ex: ('+obj.requestId+') # 10%off' ;


  for (var i = 0; i<numbers.length; i++){

    formattedNumber='+1'+numbers[i];

    promTwilSend({
      body: message,
      to: formattedNumber,
      from: '+13122340362'
    })
    .then(function(data){
    })

  }
}

exports.sendConfirmation = function(number, orderId, size, time){
  var formattedNumber = '+1'+number;
  var formattedDate = misc.formatDate(time);
  var message = 'Request ('+orderId+') has accepted your offer! Their party of '+size+
      ' will arrive on '+formattedDate+'. Thanks for using Pronto!'
  promTwilSend({
    body: message,
    to: formattedNumber,
    from: '+13122340362'
  })

};