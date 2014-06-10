
angular.module('starter.controllers', ['LocalStorageModule'])

//---------------Login Controllers---------------
.controller('LoginUserCtrl', function($scope, LoginRequest) {
  $scope.login = LoginRequest.login;
})

.controller('LoginRestCtrl', function($scope, LoginRequest) {
  $scope.login = LoginRequest.login;
})

.controller('SignupTransitionCtrl', function($scope, $state, $stateParams,checkAuthentication, localStorageService) {
    //check for token in local storage
    var token = localStorageService.get('token');

    if(!token) {
      //if token doesn't exist go to login page
      $state.transitionTo('login.user');
    }else{
      //if token exist check to see if it's user or restaurant

      if (localStorageService.get('user') === 'true'){
        // sync with the server on user token
        checkAuthentication.check('user')
        .success(function(data, status){
          $state.go('user.new');
        })
        .error(function(data, status){
          $state.go('login.user');
        })
      }else{
        // sync with the server on restaurant token
        checkAuthentication.check('restaurant')
        .success(function(data, status){
          $state.go('rest.requests');
        })
        .error(function(data, status){
          $state.go('login.restaurant');
        })
      }
    }
})

//---------------Signup Controllers---------------
.controller('SignupCtrl', function($scope, localStorageService, $state, $http, ServerUrls) {
  //identify input for signup
  $scope.restInfo = {};
  $scope.restInfo.businessName;
  $scope.restInfo.address;
  $scope.restInfo.city;
  $scope.restInfo.state;
  $scope.restInfo.zipCode;
  $scope.restInfo.phoneNumber;
  $scope.restInfo.accessToken = localStorageService.get('token');

  $scope.submit = function(){
    //submit post to server to save restaurant info
    $http({
      method: 'POST',
      url: ServerUrls.url+'/signup/business',
      data: $scope.restInfo
    })
    .success(function(data){
      // save restaurant token and id
      localStorageService.set('token', data.accessToken);
      localStorageService.set('restaurantId', data.businessId);
      localStorageService.set('user', false);
      $state.transitionTo('rest.requests');
    })
    .error(function(data){
      console.log('error! ', data);
    })
  }
})

//---------------User Controllers---------------
.controller('NewCtrl', function($q, $scope, $state, $location, GetLocation, $http, localStorageService, ServerUrls, PushNotification) {
  //requestObj will be sent to server after hitting submit
  // initialize user push notification
  PushNotification.onDeviceReady('user');

  //intialize value for radius tab and min tab
  $scope.tabA = 1;
  $scope.tabB = 1;

  //initialize value for requests
  $scope.requestObj = {};
  $scope.requestObj.radius = 0.5;
  $scope.requestObj.mins = 15;
  $scope.requestObj.groupSize;
  $scope.requestObj.accessToken = localStorageService.get('token');
  $scope.requestObj.userId = localStorageService.get('userId');

  $scope.model = {};
  $scope.model.inputLocation;
  //console.log('Obj', $scope.requestObj);

  //set the distance on the request object when a distance button is clicked
  $scope.setDistance = function(distance){
    $scope.requestObj.radius = distance;
  };

  //set the minutes on the request object when a distance button is clicked
  $scope.setMins = function(mins){
    $scope.requestObj.mins = mins;
  };

  //Configure the location data
  $scope.setLocation = function(){

    if ($scope.model.inputLocation === undefined){
      $scope.model.inputLocation = 'current location'
    }

    // set defer as a promise
    var deferred = $q.defer();

    //if the location field remains as 'current location', get long/lat coordinates
    if ($scope.model.inputLocation.toLowerCase() === 'current location'){
      GetLocation.longLat()
      .then(function(data){
        $scope.requestObj.location = data;
        deferred.resolve(data);
      })

    //otherwise set the location field to the user input (server will get long/lat coordinates)
    } else {
      $scope.requestObj.location = $scope.model.inputLocation;
      deferred.resolve();
    }

    //return promise for chaining
    return deferred.promise;
  }

  //send the request
  $scope.sendRequest = function(){
    // send the user request to the server
    if ($scope.requestObj.groupSize === undefined){
      $scope.requestObj.groupSize = 1;
    }
    // set user location base on GPS or user input location
    $scope.setLocation()
    .then(function(){
      //send post request for server to post user request
      $http({
        method: 'POST',
        url: ServerUrls.url+'/request',
        data: $scope.requestObj
      })
      .success(function(data){
        $state.go('user.active');
      })
      .error(function(data){
        console.log('error! ', data);
      })
    })
  }
})

.controller('ActiveCtrl', function($scope, $rootScope, $state, $stateParams, $timeout, $interval, CalculateStars, UserActiveRequest) {
  // initialize state toggle keys
  $scope.hideRequest = false;
  $scope.defaultHide = true;
  $scope.updateData = function () {
    // send server request to update all active offers from restaurant
    UserActiveRequest.all()
      .success(function(data, status){
        //if offers are avaliable set toggle keys
        $scope.defaultHide = false;
        if (data === ''){
          $scope.hideRequest = true;
        }
        $scope.response = data;
        $scope.offers = data.results;

        //set angular filter on offers
        if($scope.response.requestStatus === 'Accepted'){
          $scope.filterOn = 'Accepted';
        } else {
          $scope.filterOn = 'Offered';
        }

      })
      .error(function(data, status){
        console.log('active data request failed')
      })
      .finally(function() {
       // Stop the ion-refresher from spinning
       $scope.$broadcast('scroll.refreshComplete');
     });
  };

  $scope.reject = function(businessId){
    // send request to server to rejeect restaurant offer
    UserActiveRequest.reject($scope.response.requestId, businessId)
    .then(function () {
      // reload current state
      $state.transitionTo($state.current, $stateParams, {
        reload: true,
        inherit: false,
        notify: true
      });
    });
  };

  $scope.accept = function(businessId){
    // send request to server to accept restaurant offer
    UserActiveRequest.accept($scope.response.requestId, businessId)
    .then(function () {
      // reload current state
      $state.transitionTo($state.current, $stateParams, {
        reload: true,
        inherit: false,
        notify: true
      });

    });
  };

  // set yelp stars
  $scope.calculateStars = CalculateStars.calculateStars;

  $scope.go = function(url){
    // got to yelp mobile page
    if (url !== undefined){
      loginWindow = window.open(url, '_blank', 'location=yes,toolbar=yes');
    }
  };

  // run updateData
  $scope.updateData();

  $scope.isExpired = function (expirationTime) {
    // check to see if the offer is expired
    var expireTimeUnix = Date.parse(expirationTime)/1000;
    var currentTimeUnix = $scope.currentTime.unix();
    return expireTimeUnix < currentTimeUnix;
  }

  // reference to set timeout to cancel later
  var refreshPromise;

  var refreshTime = function () {
    // refresh current time scope
    $scope.currentTime = moment();
    $scope.isExpired();
    refreshPromise = $timeout(refreshTime, 1000);
  }
  refreshTime();

  $rootScope.$on('$stateChangeStart', function() {
    //cancel refreshTime
    $timeout.cancel(refreshPromise);
  });

})

.controller('SettingsCtrl', function($scope, $state, localStorageService) {
  $scope.logout = function(){
    // remove all data from local storage
    localStorageService.remove('token');
    localStorageService.remove('userId');
    localStorageService.remove('user');
    $state.go('login.user');
  }
})

//---------Restaurant Controllers

.controller('RequestsCtrl', function($scope, $rootScope, $interval, Requests, PushNotification) {
  //set pushnotification for business
  PushNotification.onDeviceReady('business');

  $scope.updateData = function () {
    // send request to server for all Requests from user
    Requests.all()
      .success(function(data, status){
        $scope.requests = data;
        $rootScope.requests = data;
      })
      .error(function(data, status){
        console.log('error: requests from server');
      })
      .finally(function() {
       // Stop the ion-refresher from spinning
       $scope.$broadcast('scroll.refreshComplete');
     });
  };

  // initiate updateData
  $scope.updateData();

  // go to request detail page
  $scope.go = Requests.go;

  $scope.delete = function(index){
    //remove rejected request
    var request = $scope.requests.splice(index, 1);
    console.log(request);
    Requests.decline(request[0]);
  };
})

.controller('RequestDetailCtrl', function($scope, $stateParams, $location, Requests) {
  // find request id
  $scope.request = Requests.get($scope.requests, $stateParams.requestId);

  $scope.accept = function(offer){
    //accept offer
    Requests.accept($scope.request.requestId, offer)
    .success(function(data,status){
      $location.path('/rest/requests')
    })
  };
})

.controller('ExistingOffersCtrl', function($scope, $rootScope, $interval, ExistingOffers) {
  $scope.updateData = function () {
    // send request to server to all existing offers
    ExistingOffers.all()
    .success(function(data,status){
      $scope.existingOffers = data;
    })
    .error(function(data, status){
      console.log('existing offer error');
    })
    .finally(function() {
      // Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    });
  };
  $scope.updateData();
})

.controller('AcceptedOffersCtrl', function($scope, $rootScope, $interval, AcceptedOffers) {
  $scope.updateData = function () {
    // send request to server to get all accepted offers
    AcceptedOffers.all()
    .success(function(data,status){
      $scope.acceptedOffers = data;
    })
    .error(function(data, status){
      console.log('existing offer error');
    })
    .finally(function() {
      // Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    });
  };
  $scope.updateData();

})

.controller('RestSettingsCtrl', function($scope, $state, localStorageService) {
  $scope.logout = function(){
    //log out remove all data in local storage
    localStorageService.remove('token');
    localStorageService.remove('restaurantId');
    localStorageService.remove('user');
    $state.go('login.user');
  }
});
