angular.module('starter.services', ['LocalStorageModule'])

//Configures the url that http requests should be sent to 
.factory('ServerUrls', function(){
  return {
    //Dev urls
    // url: 'http://10.8.32.232:3000'
    // url: 'http://localhost:3000'

    //Production urls
    url: 'http://prontoeats.azurewebsites.net'
  };
})


//Configures Push Notification Service
.factory('PushNotification', function($state, $http, ServerUrls, localStorageService, $window){

  //Variable to store push notification object from Cordova PushPlugin
  var pushNotification;

  //Callback function for when the device is ready. Used to setup push notification callbacks and registering 
  //for push notifications
  var onDeviceReady = function(type){
    pushNotification = window.plugins.pushNotification;

    //variable to store callback function that will be called after iOS device registers for push notifications through APN
    var tokenHandler;

    //check user type and configure appropriate callbacks
    //standard user type
    if(type === 'user'){
      tokenHandler = userTokenHandler;
      window.prontoApp.onNotificationGCM = window.prontoApp.userOnNotificationGCM

    //otherwise business user type
    } else {
      tokenHandler = businessTokenHandler;
      window.prontoApp.onNotificationGCM = window.prontoApp.businessOnNotificationGCM
    }

    //check the device platform and register devices
    try{
      if (device.platform === 'android'
        || device.platform === 'Android'
        || device.platform === 'amazon-fireos'){
        pushNotification.register(
          successHandler,
          errorHandler,
          //senderId is the google app id
          //ecb is the callback function when the device receives a GCM push notification
          { senderID:"763850460204",
            ecb: "window.prontoApp.onNotificationGCM"
          }
        );
      } else {
        console.log('got to else statement');
        pushNotification.register(
          tokenHandler,
          errorHandler,
          //ecb is the callback function when the device receives an APN push notifications
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
  };

  //creating a global object to store the push notification callbacks
  //push notification callbacks need to be in the global scope in order to be called

  window.prontoApp = {};

  //Function that will be called when push notification is received from APN
  window.prontoApp.onNotificationAPN = function(e) {    
    if (e.badge){
      pushNotification.setApplicationIconBadgeNumber(badgeSuccessHandler, e.badge);
    }
  }

  //Function that will be called when a user push notification is received from GCM
  window.prontoApp.userOnNotificationGCM  = function(e) {

    //If the GCM even is of type registered send the GCM reg Id to the server for storage
    if (e.event === "registered"){
      if (e.regid.length > 0 ){
        var accessToken = localStorageService.get('token');
        var userId = localStorageService.get('userId')
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
          console.log('RegId Send Successful ',data);
        })
        .fail(function(err){
          console.log('RegId Send Failed ', err);
        })
      }

    //If the GCM event is of message type, log the message
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

  //Function that will be called when a restaurant push notification is received
  window.prontoApp.businessOnNotificationGCM  = function(e) {

    //If the GCM even is of type registered send the GCM reg Id to the server for storage
    if (e.event === "registered"){
      if (e.regid.length > 0 ){
        var accessToken = localStorageService.get('token');
        var businessId = localStorageService.get('restaurantId');
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

    //If the GCM event is of message type, log the message
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

  //Function that will be called when a user receives the token back from APN
  var userTokenHandler = function(result){
    var accessToken = localStorageService.get('token');
    var userId = localStorageService.get('userId');

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

  //Function that will be called when a restaurant receives the token back from APN
  var businessTokenHandler = function(result){
    var accessToken = localStorageService.get('token');
    var businessId = localStorageService.get('restaurantId');

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

  //Callback functions for a successful registration of GCM
  var successHandler = function (result){
    console.log('success:', result);
  }

  //Callback functions for an unsuccessful registration of GCM
  var errorHandler = function(result){
    console.log('error:', result);
  }

  //return an object with push notification functions defined above
  return {
    onDeviceReady: onDeviceReady
  };
})

//Factory that creates a service that will confirm with the server that the local credentials are valid
.factory('checkAuthentication', function($http, localStorageService, ServerUrls){
  var check = function(type){
    var path = '';
    var data = {};

    //configure the target route and data object for the http request depending on the user type
    //if standard user type
    if (type === 'user'){
      path = '/validate';
      data = {
        accessToken: localStorageService.get('token'),
        userId: localStorageService.get('userId')
      };
    //if business user type
    } else {
      path = '/business/validate';
      data = {
        accessToken: localStorageService.get('token'),
        businessId: localStorageService.get('restaurantId')
      };
    }

    //execute the http request and return promise
    return $http({
        method: 'POST',
        url: ServerUrls.url + path,
        data: data
      });
  }

  //return an object with the function defined above.
  return{
    check:check
  }
})

//Creates a service to manage the OAuth authentication process with Google
.factory('LoginRequest', function($http, $state, $stateParams, $window, Google, localStorageService, ServerUrls, $ionicLoading) {

  //Configure URL to be used for http request to Google
  var url = Google.authorize+'?client_id='+ Google.client_id + '&response_type=code' +
    '&redirect_uri='+Google.redirect_uri +'&scope=' + Google.scope;

  //variable to store the inapp browser windows that will be opened
  var loginWindow;

  //Google OAuth function
  var login = function (type) {

    //Initializing variables
    var errorState;
    var postUrl;

    //configure variables based on type
    if (type === 'user'){
      errorState = 'login.user';
      postUrl = ServerUrls.url+'/login/user';
    } else {
      errorState = 'login.restaurant';
      postUrl = ServerUrls.url+'/login/business';
    }

    //open an inapp browser login window with the google OAuth url
    loginWindow = $window.open(url, '_blank', 'location=no,toolbar=no');

    //add an event listener to catch the redirect uri after google authentication
    loginWindow.addEventListener('loadstart', function(e) {
      var url = e.url;

      //parse the code or error in the redirect uri
      var code = /\?code=(.+)$/.exec(url);
      var error = /\?error=(.+)$/.exec(url);

      //if there was an error, close window and transition to error state
      if (error){
        loginWindow.close();
        $state.transitionTo(errorState, $stateParams, {
          reload: true,
          inherit: false,
          notify: true
        });
      }

      //if there was a valid code back by google
      if (code) {
        //show the loading page
        $ionicLoading.show({
          content: 'Loading',
          animation: 'fade-in',
          showBackdrop: true,
          maxWidth: 200,
          showDelay: 0
        });

        //close the inapp browser window
        loginWindow.close();

        //send the google authentication code to the server to exchange for a token
        $http ({
          method: 'POST',
          url: postUrl,
          data: {
            code: code[1]
          }
        //if successful , store the token, userId, and user type into local storage
        }).success(function(data, status){
          //if the user is a standard user
          if (type === 'user'){
            localStorageService.set('token', data.accessToken);
            localStorageService.set('userId', data.userId);
            localStorageService.set('user', true);

            //hide loading page and transition to user.new state
            $ionicLoading.hide();
            $state.transitionTo('user.new');

          //user is a restaurant user
          } else {
            //store token into local storage
            localStorageService.set('token', data.accessToken);

            //if the business does not currently exist in the server, route user to the signup page so the
            //restaurant can fill in more information about the restaurant
            if (data.signup){
              $ionicLoading.hide();
              $state.transitionTo('signup.signup');

            //otherwse, the business does exist, store the restaurantId and user type in local storage 
            //and transition to the rest.requests state
            }else{
              localStorageService.set('restaurantId', data.businessId);
              localStorageService.set('user', false);
              $ionicLoading.hide();
              $state.transitionTo('rest.requests');
            }
          }

        //if there was an error swapping the code for a token, close the inapp browser window and 
        //transition to the error state
        }).error(function(data, status){
          loginWindow.close();
          $ionicLoading.hide();
          $state.transitionTo(errorState, $stateParams, {
            reload: true,
            inherit: false,
            notify: true
          });
        });
      }
    });
  };

  //return an object with the function defined above
  return {
    login: login
  };
})


//Returns a service to be used by the user.active controller
.factory('UserActiveRequest', function($http, localStorageService,ServerUrls){
   
   //function to get the latest request by the user from the server
   var all = function(){

    //gathering the information from local storage and encoding it in the url
     var userId = localStorageService.get('userId');
     var accessToken = localStorageService.get('token');
     var url = ServerUrls.url+'/requests?userId='+userId+'&accessToken='+accessToken;
     return $http({
       method: 'GET',
       url: url
     });
   };

  //function to be used when a user rejects a restaurant offer.
  //sends the requestId and businessId to the server for processing 
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

  //function to be used when a user accepts a restaurant offer.
  //sends the requestId and businessId to the server for processing 
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

 //returns an object with all of the functions defined above
 return {
     all:all,
     accept: accept,
     reject: reject
   };
})


//Creates a service to get the longitude and latitude coordinates from device GPS
.factory('GetLocation', function($q) {

  var longLat = function(){

    //create a promise since getting the geolocation function is an asynchronous
    var deferred = $q.defer();

    navigator.geolocation.getCurrentPosition(
      //resolve the promise if the longitude and latitude coordinates were successfully gathered
      function(pos) {
        deferred.resolve([pos.coords.longitude, pos.coords.latitude])
        }, 
      //raise an alert if there was an issue
      function(error) {
        alert('Unable to get location: ' + error.message);
      }
    );
    //return promise object
    return deferred.promise;
  }

  //return object with the functions defined above
  return {
    longLat: longLat
  };
})


//Service to get list of offers that were sent
.factory('ExistingOffers', function($http, localStorageService,ServerUrls) {
  var all = function(){
    //gather the credentials from local storage and encode it into the url
    var businessId = localStorageService.get('restaurantId');
    var accessToken = localStorageService.get('token');
    var url = ServerUrls.url+'/business/offered?businessId='+businessId+
      '&accessToken='+accessToken;

    //execute the http request and return a promise
    return $http({
      method:'GET',
      url: url
    });
  }

  //return an object with the function defined above
  return {
    all: all
  };
})

//Service to get all requests from the server
.factory('Requests', function($http, localStorageService, $location, ServerUrls) {
  var all = function(){

    //gather the credentials from local storage and encode it into the url
    var businessId = localStorageService.get('restaurantId');
    var accessToken = localStorageService.get('token');
    var url = ServerUrls.url+'/business/requests?businessId='+businessId+'&accessToken='+accessToken;

    //execute the http request and return a promise
    return $http({
      method:'GET',
      url: url
    })
  };

  //get the request data to be passed into the next state (request.detail)
  var get = function(requests, requestId) {
    // Simple index lookup
    for(var i =0; i<requests.length; i++){
      if (requests[i].requestId === requestId*1){
        return requests[i];
      }
    }
  }

  //go to the request.detail state
  var go = function(request){
    path = 'rest/request/' + request.requestId;
    $location.path(path);
  };


  //function to be used for declining requeusts
  var decline = function(request){

    //send http request to decline request and return a promise
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

  //function to be used for accepting requeusts
  var accept = function(requestId, offer){

    //send http request to decline request and return a promise
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

  //return an object with the function defined above
  return {
    all: all,
    get: get,
    go: go,
    decline:decline,
    accept: accept
  };
})


//service to be used with the rest.existingOffer controller
.factory('AcceptedOffers', function($http, localStorageService, ServerUrls) {

  //get all requests that the restaurant has sent offers to
  var all = function(){

    //gather the credentials from local storage and encode it into the url
    var businessId = localStorageService.get('restaurantId');
    var accessToken = localStorageService.get('token');
    var url = ServerUrls.url+'/business/accepted?businessId='+businessId+
      '&accessToken='+accessToken;

    //execute the http request and return a promise
    return $http({
      method:'GET',
      url: url
    });
  }

  //return an object with the function defined above
  return {
    all: all
  };
})


//convert the yelp stars numeric data to a string that will be applied as a class for displaying the yelp stars
.factory('CalculateStars', function() {

  var calculateStars = function(value){
    if(value < 1){
      return 'rating stars_0';
    }else if (value <1.5){
      return 'rating stars_1';
    }else if (value <2){
      return 'rating stars_1_half';
    }else if(value<2.5){
      return 'rating stars_2';
    }else if(value<3){
      return 'rating stars_2_half';
    }else if (value <3.5){
      return 'rating stars_3';
    }else if(value<4){
      return 'rating stars_3_half';
    }else if(value<4.5){
      return 'rating stars_4';
    }else if(value<5){
      return 'rating stars_4_half';
    }else{
      return 'rating stars_5';
    }
  }

  //return an object with the function defined above
  return {
    calculateStars: calculateStars
  };
})
