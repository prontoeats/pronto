
angular.module('starter.controllers', ['LocalStorageModule'])

//---------------Login Controllers---------------
.controller('LoginUserCtrl', function($scope, Google, $window, $document, localStorageService, $state, $http) {
  var url = Google.authorize+'?client_id='+ Google.client_id + '&response_type=code' +
    '&redirect_uri='+Google.redirect_uri +'&scope=' + Google.scope;

  var loginWindow;                                                                                
  $scope.login = function () {
    loginWindow = $window.open(url, '_blank', 'location=no,toolbar=no');

    loginWindow.addEventListener('loadstart', function(e) {
      var url = e.url;
      var code = /\?code=(.+)$/.exec(url);
      var error = /\?error=(.+)$/.exec(url);

      if (code) {
        $http ({
          method: 'POST', 
          url: 'http://localhost:3000/login/user',
          data: {
            code: code[1]
          }
        }).success(function(data, status){
          window.alert('http '+ data.accessToken);
          localStorageService.set('token', data.accessToken);
          localStorageService.set('userId', data.userId);
          loginWindow.close();
          $state.transitionTo('user.new');
        }).error(function(data, status){
          window.alert('failed '+status);
          loginWindow.close();
          $state.transitionTo('login.user');
        });
      }
    });
  };
})

.controller('LoginRestCtrl', function($scope, Google, $window, $document, localStorageService, $state, $http) {
  var url = Google.authorize+'?client_id='+ Google.client_id + '&response_type=code' +
    '&redirect_uri='+Google.redirect_uri +'&scope=' + Google.scope;

  var loginWindow;                                                                                
  $scope.login = function () {
    loginWindow = $window.open(url, '_blank', 'location=no,toolbar=no');

    loginWindow.addEventListener('loadstart', function(e) {
      var url = e.url;
      var code = /\?code=(.+)$/.exec(url);
      var error = /\?error=(.+)$/.exec(url);

      if (code) {
        $http ({
          method: 'POST', 
          url: 'http://localhost:3000/login/business',
          data: {
            code: code[1]
          }
        }).success(function(data, status){
          window.alert('http '+ data.accessToken);
          if (data.signup){
            window.alert('signup is true');
            localStorageService.set('token', data.accessToken);
            loginWindow.close();
            $state.transitionTo('signup.signup');
          }else{
            localStorageService.set('token', data.accessToken);
            localStorageService.set('restaurantId', data.businessId);
            window.alert('signup failed');

            loginWindow.close();
            $state.transitionTo('rest.requests');
          }
        }).error(function(data, status){
          window.alert('failed '+status);
          loginWindow.close();
          $state.transitionTo('login.restaurant');
        });
      }
    });
  };
})

//---------------Signup Controllers---------------
.controller('SignupCtrl', function($scope, localStorageService, $state, $http) {
  $scope.restInfo = {};
  $scope.restInfo.businessName = 'Jimmy';
  $scope.restInfo.address = '944 Market St';
  $scope.restInfo.city = 'San Francisco';
  $scope.restInfo.state = 'CA';
  $scope.restInfo.zipCode = '94103';
  $scope.restInfo.phoneNumber = '3124794923';
  $scope.restInfo.accessToken = localStorageService.get('token');
  // $scope.restInfo.id = localStorageService.get('restaurantId');

  $scope.submit = function(){
    console.log($scope.restInfo);
    $http({
      method: 'POST',
      url: 'http://localhost:3000/signup/business',
      data: $scope.restInfo
    })
    .success(function(data){
      localStorageService.set('token', data.accessToken);
      localStorageService.set('restaurantId', data.businessId);
      console.log('success! ', data);
      $state.transitionTo('rest.requests');
    })
    .error(function(data){
      console.log('error! ', data);
    })
  }
})

//---------------User Controllers---------------
.controller('NewCtrl', function($q, $scope, $state, GetLocation, $http, localStorageService) {

  //Initialize defaults

  //requestObj will be sent to server after hitting submit
  $scope.requestObj = {};
  $scope.requestObj.radius = 0.5;
  $scope.requestObj.mins = 15;
  $scope.requestObj.groupSize = 1;
  $scope.requestObj.accessToken = localStorageService.get('token');
  $scope.requestObj.userId = localStorageService.get('userId');

  $scope.model = {};
  $scope.model.inputLocation = 'Current Location';
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
    console.log('Group Size ', $scope.requestObj.groupSize);
  };

  //Configure the location data
  $scope.setLocation = function(){

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

    $scope.setLocation()
    .then(function(){
      console.log('Request Object ',$scope.requestObj);

      $http({
        method: 'POST',
        url: 'http://localhost:3000/request',
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

.controller('ActiveCtrl', function($scope, UserActiveRequest, OffersTestData) {
  UserActiveRequest.all()
    .success(function(data, status){
      console.log('got active requests back', data);
      $scope.response = data;
      $scope.offers = data.results;
    })
    .error(function(data, status){
      console.log('active data request failed')
    })

  $scope.declinedOffers = [];
  $scope.decline = function(index){
    $scope.declinedOffers.push($scope.offers.splice(index,1));
  };
})

.controller('SettingsCtrl', function($scope) {
  $scope.test = function(){
    var ref = window.open('http://www.yelp.com/biz/kusina-ni-tess-san-francisco', '_blank');
  }
})


.controller('HistoryCtrl', function($scope, $ionicLoading) {
})


//---------Restaurant Controllers

.controller('RequestsCtrl', function($scope, $rootScope, Requests) {
  Requests.all()
    .success(function(data, status){
      console.log('Got requests from server: ', data);
      $scope.requests = data;
      $rootScope.requests = data;
    })
    .error(function(data, status){
      console.log('error: requests from server');
    })

  $scope.go = Requests.go;

  $scope.delete = function(index){
    var request = $scope.requests.splice(index, 1);
    console.log(request);
    Requests.decline(request[0]);
  };
})

.controller('RequestDetailCtrl', function($scope, $stateParams, $location, Requests) {
  $scope.request = Requests.get($scope.requests, $stateParams.requestId);
  $scope.accept = function(offer){
    console.log($scope.request, offer);
    Requests.accept($scope.request.requestId, offer)
    $location.path('/rest/requests')
  };
})

.controller('ExistingOffersCtrl', function($scope, ExistingOffers) {
  $scope.existingOffers = ExistingOffers.all();
})

.controller('ExistingOfferDetailCtrl', function($scope, $stateParams, ExistingOffers) {
  $scope.existingOffer = ExistingOffers.get($stateParams.existingOfferId);
})

.controller('AcceptedOffersCtrl', function($scope, AcceptedOffers) {
  $scope.acceptedOffers = AcceptedOffers.all();
})

.controller('AcceptedOfferDetailCtrl', function($scope, $stateParams, AcceptedOffers) {
  $scope.acceptedOffer = AcceptedOffers.get($stateParams.acceptedOfferId);
});


/*.controller('LoginCtrl', function($scope, Google, $window, $document, localStorageService, $state, $http) {
  var url = Google.authorize+'?client_id='+ Google.client_id + '&response_type=code' +
    '&redirect_uri='+Google.redirect_uri +'&scope=' + Google.scope;

  var loginWindow;                                                                                
  $scope.login = function () {
    loginWindow = $window.open(url, '_blank', 'location=no,toolbar=no');

    loginWindow.addEventListener('loadstart', function(e) {
      var url = e.url;
      var code = /\?code=(.+)$/.exec(url);
      var error = /\?error=(.+)$/.exec(url);

      if (code) {
        var url2 = 'code='+code[1]+'&client_id='+Google.client_id+
        '&client_secret='+Google.client_secret+'&redirect_uri='+
        Google.redirect_uri+'&grant_type=authorization_code';
        
        //window.alert('url: '+url2);
        $http ({
          method: 'POST', 
          url: 'https://accounts.google.com/o/oauth2/token',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: url2
        }).success(function(data, status){
          window.alert('http '+ data.access_token);
          // loginWindow.close();
          // $state.transitionTo('tab.requests');
          // $state.transitionTo('tab.request');
          var url3 = 'https://www.googleapis.com/plus/v1/people/me?access_token=' + data.access_token;

          $http({
            method: 'GET',
            url: url3,
            // url: 'https://www.googleapis.com/plus/v1/people/me',
            // headers: {
            //   'Authorization': 'Bearer ' + data.access_token
            // }
          }).success(function(data){
            var temp = JSON.stringify(data)
            window.alert('success! '+ temp);

            $http({
              method: 'POST',
              url: 'http://localhost:3000/request',
              data: data
            }).success(function(data){
              window.alert('success! ');
              // $state.go('user.active');
            }).error(function(data, status){
              window.alert('fail to get user info');
            })

            // $state.go('user.active');
          }).error(function(data, status){
            var temp = JSON.stringify(data);
            window.alert('fail to get user info'+temp);
          })
        }).error(function(data, status){
          window.alert('failed '+status);
        });
      }
    });

    $scope.showToken = function () {
    $scope.token = localStorageService.get('token');
    };
  };
})*/
