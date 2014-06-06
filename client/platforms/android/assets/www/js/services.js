angular.module('starter.services', ['LocalStorageModule'])

.factory('ServerUrls', function(){
  return {
    url: 'http://10.8.32.232:3000'
    // url: 'http://localhost:3000'
    // url: 'http://prontoeats.azurewebsites.net'
  };
})

.factory('PushNotification', function($state, $http, ServerUrls, localStorageService){
  var pushNotification;

  var onDeviceReady = function(type){
    console.log('device ready, even received');

    pushNotification = window.plugins.pushNotification;

    console.log('registering device type: ' + device.platform);

    var tokenHandler;
    // var successHandler;

    if(type === 'user'){
      tokenHandler = userTokenHandler;
      window.prontoApp.onNotificationGCM = window.prontoApp.userOnNotificationGCM
      console.log('got to user handler in services', typeof tokenHandler);
    } else {
      tokenHandler = businessTokenHandler;
      window.prontoApp.onNotificationGCM = window.prontoApp.businessOnNotificationGCM
    }

    console.log('types --------');
    console.log('successHandler', typeof successHandler);
    console.log('errorHandler', typeof errorHandler);
    console.log('window push', typeof window.prontoApp.onNotificationGCM);


    try{
      if (device.platform === 'android'
        || device.platform === 'Android'
        || device.platform === 'amazon-fireos'){
        pushNotification.register(
          successHandler,
          errorHandler,
          { senderID:"763850460204",
            ecb: "window.prontoApp.onNotificationGCM"
          }
        );
      } else {
        console.log('got to else statement');
        pushNotification.register(
          tokenHandler,
          errorHandler,
          { badge: 'true',
            sound: 'true',
            alert: 'true',
            ecb: "window.prontoApp.onNotificationAPN"
          }
        );
      }
    } catch (err){
      console.log('errer registering with the device');
    }
      // pushNotification.unregister(function(e){console.log('unregistered', e)},
      // function(e){
      // console.log('issue unregistering',e)});
  };

  window.prontoApp = {};

  window.prontoApp.onNotificationAPN = function(e) {
    var state = JSON.stringify($state);
    console.log('state variable', state);

    if (e.badge){
      pushNotification.setApplicationIconBadgeNumber(badgeSuccessHandler, e.badge);
    }
  }

  window.prontoApp.userOnNotificationGCM  = function(e) {
    console.log('Event from android: ', e.event);

    if (e.event === "registered"){
      if (e.regid.length > 0 ){
        console.log('android register id: ', e.regid);

        var accessToken = localStorageService.get('token');
        var userId = localStorageService.get('userId')

        console.log('access token: ', accessToken);
        console.log('businessId: ', userId);

        var httpObj = {
          method: 'POST',
          url: ServerUrls.url+'/token',
          data: {
            accessToken: accessToken,
            userId: userId,
            code: e.regid,
            type: 'gcm'
          }
        };

        $http(httpObj)
        .success(function(data){
          console.log('Token Send Successful ',data);
        })
        .fail(function(err){
          console.log('Token Send Failed ', err);
        })

      }
    }else if(e.event === "message"){
      if (e.foreground){
        console.log('inline notification');
      } else { // otherwise we were launched because the user touched a notification in the notification tray.
        if (e.coldstart){
          console.log('-COLDSTART NOTIFICATION-');
        } else {
          console.log('-BACKGROUND NOTIFICATION-');
        }
      }

      console.log('MESSAGE -> MSG: ' + e.payload.message);
      //android only
      console.log('MESSAGE -> MSGCNT: ' + e.payload.msgcnt);
      //amazon-fireos only
      console.log('MESSAGE -> TIMESTAMP: ' + e.payload.timeStamp);
    } else if( e.event === 'error'){
      console.log('ERROR -> MSG:' + e.msg);
    } else {
      console.log('EVENT -> Unknown, an event was received and we do not know what it is');
    }
  }

  window.prontoApp.businessOnNotificationGCM  = function(e) {
    console.log('Event from android: ', e.event);

    if (e.event === "registered"){
      if (e.regid.length > 0 ){
        console.log('android register id: ', e.regid);

        var accessToken = localStorageService.get('token');
        var businessId = localStorageService.get('restaurantId');

        console.log('access token: ', accessToken);
        console.log('businessId: ', businessId);

        var httpObj = {
          method: 'POST',
          url: ServerUrls.url+'/business/token',
          data: {
            accessToken: accessToken,
            businessId: businessId,
            code: e.regid,
            type: 'gcm'
          }
        };

        $http(httpObj)
        .success(function(data){
          console.log('RegId Send Successful ',data);
        })
        .fail(function(err){
          console.log('RegId Send Failed ', err);
        })
      }
    }else if(e.event === "message"){
      if (e.foreground){
        console.log('inline notification');
      } else { // otherwise we were launched because the user touched a notification in the notification tray.
        if (e.coldstart){
          console.log('-COLDSTART NOTIFICATION-');
        } else {
          console.log('-BACKGROUND NOTIFICATION-');
        }
      }

      console.log('MESSAGE -> MSG: ' + e.payload.message);
      //android only
      console.log('MESSAGE -> MSGCNT: ' + e.payload.msgcnt);
      //amazon-fireos only
      console.log('MESSAGE -> TIMESTAMP: ' + e.payload.timeStamp);
    } else if( e.event === 'error'){
      console.log('ERROR -> MSG:' + e.msg);
    } else {
      console.log('EVENT -> Unknown, an event was received and we do not know what it is');
    }
  }


  var userTokenHandler = function(result){
    console.log('token: ', result);

    var accessToken = localStorageService.get('token');
    var userId = localStorageService.get('userId')

    console.log('access token: ', accessToken);
    console.log('businessId: ', userId);

    var httpObj = {
      method: 'POST',
      url: ServerUrls.url+'/token',
      data: {
        accessToken: accessToken,
        userId: userId,
        code: result,
        type: 'apn'
      }
    };

    $http(httpObj)
    .success(function(data){
      console.log('Token Send Successful ',data);
    })
    .fail(function(err){
      console.log('Token Send Failed ', err);
    })

  }

  var businessTokenHandler = function(result){
    console.log('token: ', result);

    var accessToken = localStorageService.get('token');
    var businessId = localStorageService.get('restaurantId');

    console.log('access token: ', accessToken);
    console.log('businessId: ', businessId);

    var httpObj = {
      method: 'POST',
      url: ServerUrls.url+'/business/token',
      data: {
        accessToken: accessToken,
        businessId: businessId,
        code: result,
        type: 'apn'
      }
    };

    $http(httpObj)
    .success(function(data){
      console.log('Token Send Successful ',data);
    })
    .fail(function(err){
      console.log('Token Send Failed ', err);
    })

  }

  var successHandler = function (result){
    console.log('success:', result);
  }

  var errorHandler = function(result){
    console.log('error:', result);
  }

  return {
    onDeviceReady: onDeviceReady
  };
})

.factory('UserActiveRequest', function($http, localStorageService,ServerUrls){
   var all = function(){
     var userId = localStorageService.get('userId');
     var accessToken = localStorageService.get('token');
     var url = ServerUrls.url+'/requests?userId='+userId+'&accessToken='+accessToken;
     return $http({
       method: 'GET',
       url: url
     });
   };

  var reject = function(requestId, businessId){
    console.log(requestId, businessId);
    return $http({
      method: 'POST',
      url: ServerUrls.url+'/requests/reject',
      data: {
        requestId: requestId,
        businessId: businessId,
        userId: localStorageService.get('userId'),
        accessToken: localStorageService.get('token')
      }
    })
  };

  var accept = function(requestId, businessId){
    console.log('user accept: ', requestId, businessId);
    return $http({
      method: 'POST',
      url: ServerUrls.url+'/requests/accept',
      data: {
        requestId: requestId,
        businessId: businessId,
        userId: localStorageService.get('userId'),
        accessToken: localStorageService.get('token')
      }
    })
  };

 return {
     all:all,
     accept: accept,
     reject: reject
   };
})


//Get the longitude and latitude coordinates from device GPS
.factory('GetLocation', function($q) {

  var longLat = function(){

    //create a promise since getting the position is an asynch
    var deferred = $q.defer();

    navigator.geolocation.getCurrentPosition(
      function(pos) {
        deferred.resolve([pos.coords.longitude, pos.coords.latitude])
        }, function(error) {
          alert('Unable to get location: ' + error.message);
      }
    );
    //return promise object
    return deferred.promise;
  }

  //return factory object
  return {
    longLat: longLat
  };
})

.factory('ExistingOffers', function($http, localStorageService,ServerUrls) {
  // Might use a resource here that returns a JSON array
  var all = function(){
    var businessId = localStorageService.get('restaurantId');
    var accessToken = localStorageService.get('token');
    var url = ServerUrls.url+'/business/offered?businessId='+businessId+
      '&accessToken='+accessToken;

    return $http({
      method:'GET',
      url: url
    });
  }

  return {
    all: all
  };
})

.factory('Requests', function($http, localStorageService, $location, ServerUrls) {
  var all = function(){
    var businessId = localStorageService.get('restaurantId');
    var accessToken = localStorageService.get('token');
    var url = ServerUrls.url+'/business/requests?businessId='+businessId+'&accessToken='+accessToken;

    return $http({
      method:'GET',
      url: url
    })
  };

  var get = function(requests, requestId) {
    // Simple index lookup
    for(var i =0; i<requests.length; i++){
      if (requests[i].requestId === requestId*1){
        return requests[i];
      }
    }
  }

  var go = function(request){
    path = 'rest/request/' + request.requestId;
    $location.path(path);
  };

  var decline = function(request){
    console.log(request.requestId);
    return $http({
      method: 'POST',
      url: ServerUrls.url+'/business/requests/decline',
      data: {
        requestId: request.requestId,
        businessId: localStorageService.get('restaurantId'),
        accessToken: localStorageService.get('token')
      }
    })
  };

  var accept = function(requestId, offer){
    console.log(requestId, offer);
    return $http({
      method: 'POST',
      url: ServerUrls.url+'/business/requests/accept',
      data: {
        requestId: requestId,
        offer:  offer,
        businessId: localStorageService.get('restaurantId'),
        accessToken: localStorageService.get('token')
      }
    })
  };

  return {
    all: all,
    get: get,
    go: go,
    decline:decline,
    accept: accept
  };
})

.factory('AcceptedOffers', function($http, localStorageService, ServerUrls) {

  var all = function(){
    var businessId = localStorageService.get('restaurantId');
    var accessToken = localStorageService.get('token');
    var url = ServerUrls.url+'/business/accepted?businessId='+businessId+
      '&accessToken='+accessToken;

    return $http({
      method:'GET',
      url: url
    });
  }

  return {
    all: all
  };
})