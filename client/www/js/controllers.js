
angular.module('starter.controllers', ['LocalStorageModule'])

//---------------Login Controllers---------------
.controller('LoginUserCtrl', function($scope, Google, $window, $document, localStorageService, $state, $http, ServerUrls) {
  var url = Google.authorize+'?client_id='+ Google.client_id + '&response_type=code' +
    '&redirect_uri='+Google.redirect_uri +'&scope=' + Google.scope;

  var loginWindow;
  $scope.login = function () {
    loginWindow = $window.open(url, '_blank', 'location=no,toolbar=no');

    loginWindow.addEventListener('loadstart', function(e) {
      var url = e.url;
      var code = /\?code=(.+)$/.exec(url);
      var error = /\?error=(.+)$/.exec(url);
      if (error){
        loginWindow.close();
        $state.transitionTo('login.user');
      }

      if (code) {
        loginWindow.close();
        $http ({
          method: 'POST',
          url: ServerUrls.url+'/login/user',
          data: {
            code: code[1]
          }
        }).success(function(data, status){
          localStorageService.set('token', data.accessToken);
          localStorageService.set('userId', data.userId);
          localStorageService.set('user', true);
          $state.transitionTo('user.new');
        }).error(function(data, status){
          loginWindow.close();
          $state.transitionTo('login.user');
        });
      }
    });
  };
})

.controller('LoginRestCtrl', function($scope, Google, $window, $document, localStorageService, $state, $http, ServerUrls) {
  var url = Google.authorize+'?client_id='+ Google.client_id + '&response_type=code' +
    '&redirect_uri='+Google.redirect_uri +'&scope=' + Google.scope;

  var loginWindow;
  $scope.login = function () {
    loginWindow = $window.open(url, '_blank', 'location=no,toolbar=no');

    loginWindow.addEventListener('loadstart', function(e) {
      var url = e.url;
      var code = /\?code=(.+)$/.exec(url);
      var error = /\?error=(.+)$/.exec(url);

      if (error){
        loginWindow.close();
        $state.transitionTo('login.user');
      }

      if (code) {
        loginWindow.close();
        $http ({
          method: 'POST',
          url: ServerUrls.url+'/login/business',
          data: {
            code: code[1]
          }
        }).success(function(data, status){
          if (data.signup){
            localStorageService.set('token', data.accessToken);
            $state.transitionTo('signup.signup');
          }else{
            localStorageService.set('token', data.accessToken);
            localStorageService.set('restaurantId', data.businessId);
            localStorageService.set('user', false);
            // loginWindow.close();
            $state.transitionTo('rest.requests');
          }
        }).error(function(data, status){
          loginWindow.close();
          $state.transitionTo('login.restaurant');
        });
      }
    });
  };
})

//---------------Signup Controllers---------------
.controller('SignupCtrl', function($scope, localStorageService, $state, $http, ServerUrls) {
  $scope.restInfo = {};
  $scope.restInfo.businessName;
  $scope.restInfo.address;
  $scope.restInfo.city;
  $scope.restInfo.state;
  $scope.restInfo.zipCode;
  $scope.restInfo.phoneNumber;
  $scope.restInfo.accessToken = localStorageService.get('token');
  // $scope.restInfo.id = localStorageService.get('restaurantId');

  $scope.submit = function(){
    console.log($scope.restInfo);
    $http({
      method: 'POST',
      url: ServerUrls.url+'/signup/business',
      data: $scope.restInfo
    })
    .success(function(data){
      localStorageService.set('token', data.accessToken);
      localStorageService.set('restaurantId', data.businessId);
      localStorageService.set('user', false);

      console.log('success! ', data);
      $state.transitionTo('rest.requests');
    })
    .error(function(data){
      console.log('error! ', data);
    })
  }
})

//---------------User Controllers---------------
.controller('NewCtrl', function($q, $scope, $state, $location, GetLocation, $http, localStorageService, ServerUrls) {
  //requestObj will be sent to server after hitting submit

  $scope.tabA = 1;
  $scope.tabB = 1;


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
    console.log('Distance: ', $scope.requestObj.radius);
  };

  //set the minutes on the request object when a distance button is clicked
  $scope.setMins = function(mins){
    $scope.requestObj.mins = mins;
    console.log('Distance: ', $scope.requestObj.mins);
  };

  //Configure the location data
  $scope.setLocation = function(){

    if ($scope.model.inputLocation === undefined){
      $scope.model.inputLocation = 'current location'
    }

    var deferred = $q.defer();
    console.log('input: ',$scope.model.inputLocation);
    console.log('location: ',$scope.requestObj.location);

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

    if ($scope.requestObj.groupSize === undefined){
      $scope.requestObj.groupSize = 1;
    }
    console.log('Group Size ', $scope.requestObj.groupSize);

    $scope.setLocation()
    .then(function(){
      console.log('Request Object ',$scope.requestObj);

      $http({
        method: 'POST',
        url: ServerUrls.url+'/request',
        data: $scope.requestObj
      })
      .success(function(data){
        console.log('success! ', data);
        $state.go('user.active');
      })
      .error(function(data){
        console.log('error! ', data);
      })
    })
  }
})

.controller('ActiveCtrl', function($scope, $rootScope, $state, $stateParams, $interval, UserActiveRequest) {
  console.log('active state');
  $scope.updateData = function () {
    UserActiveRequest.all()
      .success(function(data, status){
        console.log('got active requests back', data);
        $scope.response = data;
        $scope.offers = data.results;

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
    UserActiveRequest.reject($scope.response.requestId, businessId)
    .then(function () {
      console.log('rejected request');
    $state.transitionTo($state.current, $stateParams, {
        reload: true,
        inherit: false,
        notify: true
      });
    });
    console.log('got to scopeReject', $scope.response.requestId, businessId);
  };

  $scope.accept = function(businessId){
    UserActiveRequest.accept($scope.response.requestId, businessId)
    .then(function () {
      console.log('accepted request');
      $state.transitionTo($state.current, $stateParams, {
        reload: true,
        inherit: false,
        notify: true
      });

    });
    console.log('got to scopeaccept ', $scope.response.requestId, businessId);
  };

  $scope.updateData();
  // stopUpdate = $interval(updateData, 1000 * 3);

  // $rootScope.$on('$stateChangeStart', function() {
  //   $interval.cancel(stopUpdate);
  // });
})

.controller('SettingsCtrl', function($scope, $state, localStorageService) {
  // $scope.test = function(){
  //   var ref = window.open('http://www.yelp.com/biz/kusina-ni-tess-san-francisco', '_blank');
  // }
  $scope.logout = function(){
    console.log('user logout');
    localStorageService.set('token', null);
    localStorageService.set('userId', null);
    localStorageService.set('user', null);
    $state.go('login.user');
  }
})


.controller('HistoryCtrl', function($scope, $ionicLoading) {
})


//---------Restaurant Controllers

.controller('RequestsCtrl', function($scope, $rootScope, $interval, Requests) {

  $scope.updateData = function () {
    console.log('calling update data');
    Requests.all()
      .success(function(data, status){
        console.log('Got requests from server: ', data);
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

  $scope.updateData();

  $scope.go = Requests.go;

  $scope.delete = function(index){
    var request = $scope.requests.splice(index, 1);
    console.log(request);
    Requests.decline(request[0]);
  };

  // stopUpdate = $interval(updateData, 1000 * 3);

  // $rootScope.$on('$stateChangeStart', function() {
  //   $interval.cancel(stopUpdate);
  // });
})

.controller('RequestDetailCtrl', function($scope, $stateParams, $location, Requests) {
  $scope.request = Requests.get($scope.requests, $stateParams.requestId);
  $scope.accept = function(offer){
    console.log($scope.request, offer);
    Requests.accept($scope.request.requestId, offer)
    .success(function(data,status){
      $location.path('/rest/requests')
    })
  };
})

.controller('ExistingOffersCtrl', function($scope, $rootScope, $interval, ExistingOffers) {
  $scope.updateData = function () {
    ExistingOffers.all()
    .success(function(data,status){
      console.log('got existing offer back');
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
  // stopUpdate = $interval(updateData, 1000 * 3);

  // $rootScope.$on('$stateChangeStart', function() {
  //   $interval.cancel(stopUpdate);
  // });
})

// .controller('ExistingOfferDetailCtrl', function($scope, $stateParams, ExistingOffers) {
//   $scope.existingOffer = ExistingOffers.get($stateParams.existingOfferId);
// })

.controller('AcceptedOffersCtrl', function($scope, $rootScope, $interval, AcceptedOffers) {
  $scope.updateData = function () {
    AcceptedOffers.all()
    .success(function(data,status){
      console.log('got accepted offer back');
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
  // stopUpdate = $interval(updateData, 1000 * 3);

  // $rootScope.$on('$stateChangeStart', function() {
  //   $interval.cancel(stopUpdate);
  // });
})

.controller('AcceptedOfferDetailCtrl', function($scope, $stateParams, AcceptedOffers) {
  $scope.acceptedOffer = AcceptedOffers.get($stateParams.acceptedOfferId);
})

.controller('RestSettingsCtrl', function($scope, $state, localStorageService) {
  $scope.logout = function(){
    localStorageService.set('token', null);
    localStorageService.set('restaurantId', null);
    localStorageService.set('user', null);
    $state.go('login.user');
  }
});
